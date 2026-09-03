(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.WorkerLedgerCalculator = factory();
    }
})(typeof globalThis === 'object' ? globalThis : this, function () {
    'use strict';

    const round = (value, digits) => {
        const factor = Math.pow(10, digits);
        return Math.round((value + Number.EPSILON) * factor) / factor;
    };

    const number = (value) => typeof value === 'number' ? value : Number(value);
    const validNonNegative = (value) => Number.isFinite(number(value)) && number(value) >= 0;
    const validPositive = (value) => Number.isFinite(number(value)) && number(value) > 0;

    function calculateHourly(input) {
        const salaryCents = number(input.salaryCents);
        const payMonths = number(input.payMonths);
        const workdays = number(input.workdays);
        const onsiteHours = number(input.onsiteHours);
        const commuteHours = number(input.commuteHours);
        const overtimeHours = number(input.overtimeHours);
        const workCostCents = number(input.workCostCents);
        const annualHours = (workdays * (onsiteHours + commuteHours) + overtimeHours) * 12;
        if (!validNonNegative(salaryCents) || !validPositive(payMonths) || !validPositive(workdays)
            || !validNonNegative(onsiteHours) || !validNonNegative(commuteHours)
            || !validNonNegative(overtimeHours) || !validNonNegative(workCostCents)
            || !validPositive(annualHours)) {
            return null;
        }
        const annualIncomeYuan = (salaryCents * payMonths) / 100;
        const annualCostYuan = (workCostCents * 12) / 100;
        return round((annualIncomeYuan - annualCostYuan) / annualHours, 2);
    }

    function workMinutesForAmount(amountCents, hourlyYuan) {
        const cents = number(amountCents);
        const hourly = number(hourlyYuan);
        if (!validPositive(cents) || !validPositive(hourly)) {
            return null;
        }
        return Math.max(1, Math.round((cents / 100 / hourly) * 60));
    }

    function isValidIsoDate(value) {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const date = new Date(`${value}T00:00:00.000Z`);
        return date.getUTCFullYear() === Number(value.slice(0, 4))
            && date.getUTCMonth() + 1 === Number(value.slice(5, 7))
            && date.getUTCDate() === Number(value.slice(8, 10));
    }

    function isValidIsoMonth(value) { return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value); }
    function workMinutesForRate(amountCents, hourlyRateCentsPerHour) {
        const amount = number(amountCents); const rate = number(hourlyRateCentsPerHour);
        if (!validPositive(amount) || !validPositive(rate)) return null;
        return Math.max(1, Math.round(amount * 60 / rate));
    }
    function salaryForMonth(salaryHistory, month, asOfMonth) {
        if (!isValidIsoMonth(month) || !isValidIsoMonth(asOfMonth) || month > asOfMonth) return 0;
        return (salaryHistory || []).filter((item) => isValidIsoMonth(item.effectiveMonth)
            && item.effectiveMonth <= month).sort((a, b) => a.effectiveMonth.localeCompare(b.effectiveMonth))
            .reduce((salary, item) => item.monthlyTakeHomeCents, 0);
    }
    function migrateSnapshot(raw, importMonth) {
        if (raw && raw.schemaVersion === 2) return { snapshot: raw, migrated: false };
        if (raw && raw.schemaVersion !== undefined) throw new Error('不支持的备份版本');
        const snapshot = Object.assign({}, raw, {
            schemaVersion: 2,
            settings: Object.assign({}, raw && raw.settings),
            entries: Array.isArray(raw && raw.entries) ? raw.entries.slice() : [],
            salaryHistory: [{ effectiveMonth: importMonth, monthlyTakeHomeCents: raw.settings.monthlyTakeHomeCents }],
        });
        return { snapshot, migrated: true };
    }

    function validateEntry(entry) {
        if (!entry || (entry.kind !== 'income' && entry.kind !== 'expense')) {
            return '流水类型无效';
        }
        if (!Number.isInteger(number(entry.amountCents)) || !validPositive(entry.amountCents)) {
            return '金额必须是大于 0 的整数分';
        }
        if (typeof entry.category !== 'string' || !entry.category.trim()) {
            return '分类不能为空';
        }
        if (!isValidIsoDate(entry.entryDate)) {
            return '日期格式无效';
        }
        if (entry.kind === 'expense' && entry.expenseType !== 'fixed' && entry.expenseType !== 'flexible') {
            return '支出类型无效';
        }
        if (entry.kind === 'income' && entry.expenseType) {
            return '收入不能设置固定或弹性';
        }
        return null;
    }

    function validateSettings(settings) {
        const required = [
            'monthlyTakeHomeCents', 'payMonths', 'workdaysPerMonth', 'onsiteHoursPerDay',
            'commuteHoursPerDay', 'overtimeHoursPerMonth', 'workCostCentsPerMonth',
            'fundGoalCents', 'fundCurrentCents',
        ];
        if (!settings || typeof settings !== 'object') {
            return '设置缺失';
        }
        for (const key of required) {
            if (!validNonNegative(settings[key])) {
                return `设置项 ${key} 无效`;
            }
        }
        if (!validPositive(settings.payMonths) || !validPositive(settings.workdaysPerMonth)
            || !validPositive(number(settings.onsiteHoursPerDay) + number(settings.commuteHoursPerDay))) {
            return '工作时间设置必须大于 0';
        }
        return null;
    }

    function validateSnapshot(snapshot) {
        const settingsError = validateSettings(snapshot && snapshot.settings);
        if (settingsError) {
            return { ok: false, error: settingsError };
        }
        if (!snapshot || !Array.isArray(snapshot.entries)) {
            return { ok: false, error: '流水数据格式无效' };
        }
        for (const entry of snapshot.entries) {
            const entryError = validateEntry(entry);
            if (entryError) {
                return { ok: false, error: entryError };
            }
        }
        return { ok: true };
    }

    function monthlySummary(snapshot, month) {
        const settings = snapshot.settings;
        const entries = snapshot.entries.filter((entry) => entry.entryDate.indexOf(month) === 0);
        const extraIncomeCents = entries.filter((entry) => entry.kind === 'income')
            .reduce((sum, entry) => sum + entry.amountCents, 0);
        const fixedExpenseCents = entries.filter((entry) => entry.kind === 'expense' && entry.expenseType === 'fixed')
            .reduce((sum, entry) => sum + entry.amountCents, 0);
        const flexibleExpenseCents = entries.filter((entry) => entry.kind === 'expense' && entry.expenseType === 'flexible')
            .reduce((sum, entry) => sum + entry.amountCents, 0);
        const salaryCents = Array.isArray(snapshot.salaryHistory)
            ? salaryForMonth(snapshot.salaryHistory, month, month) : settings.monthlyTakeHomeCents;
        const totalIncomeCents = salaryCents + extraIncomeCents;
        return {
            salaryCents,
            extraIncomeCents,
            totalIncomeCents,
            fixedExpenseCents,
            flexibleExpenseCents,
            totalExpenseCents: fixedExpenseCents + flexibleExpenseCents,
            balanceCents: totalIncomeCents - fixedExpenseCents - flexibleExpenseCents,
            entries,
        };
    }

    function fundProjection(snapshot, month, months) {
        const count = Number.isInteger(months) && months > 0 ? months : 6;
        const summary = monthlySummary(snapshot, month);
        const points = [];
        for (let index = 0; index <= count; index += 1) {
            points.push({ month: index, cents: Math.max(0, snapshot.settings.fundCurrentCents + summary.balanceCents * index) });
        }
        return {
            goalCents: snapshot.settings.fundGoalCents,
            currentCents: snapshot.settings.fundCurrentCents,
            safetyMonths: summary.totalExpenseCents > 0
                ? round(snapshot.settings.fundCurrentCents / summary.totalExpenseCents, 1)
                : null,
            points,
        };
    }

    function scenarioResult(settings, changes) {
        const base = {
            salaryCents: settings.monthlyTakeHomeCents,
            payMonths: settings.payMonths,
            workdays: settings.workdaysPerMonth,
            onsiteHours: settings.onsiteHoursPerDay,
            commuteHours: settings.commuteHoursPerDay,
            overtimeHours: settings.overtimeHoursPerMonth,
            workCostCents: settings.workCostCentsPerMonth,
        };
        const scenario = Object.assign({}, base, {
            commuteHours: changes && changes.commuteHours !== undefined ? number(changes.commuteHours) : base.commuteHours,
            overtimeHours: changes && changes.overtimeHours !== undefined ? number(changes.overtimeHours) : base.overtimeHours,
            salaryCents: changes && changes.raisePercent !== undefined
                ? Math.round(base.salaryCents * (1 + number(changes.raisePercent) / 100))
                : base.salaryCents,
        });
        const monthlyExpenseCents = validNonNegative(settings.monthlyExpenseCents) ? settings.monthlyExpenseCents : 0;
        const monthlyExtraIncomeCents = validNonNegative(settings.monthlyExtraIncomeCents) ? settings.monthlyExtraIncomeCents : 0;
        const result = (input) => ({
            hourly: calculateHourly(input),
            annualTimeHours: round((input.workdays * (input.onsiteHours + input.commuteHours) + input.overtimeHours) * 12, 1),
            monthlyBalanceCents: input.salaryCents + monthlyExtraIncomeCents - monthlyExpenseCents,
        });
        return { baseline: result(base), scenario: result(scenario) };
    }

    return {
        calculateHourly,
        workMinutesForAmount,
        validateSnapshot,
        monthlySummary,
        fundProjection,
        scenarioResult,
        isValidIsoDate,
        isValidIsoMonth,
        workMinutesForRate,
        salaryForMonth,
        migrateSnapshot,
    };
});
