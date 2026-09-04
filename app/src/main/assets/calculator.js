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
        const hourly = round((annualIncomeYuan - annualCostYuan) / annualHours, 2);
        return validPositive(hourly) ? hourly : null;
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
    const MAX_SAFE = Number.MAX_SAFE_INTEGER;
    const isSafeInteger = (value) => typeof value === 'number' && Number.isSafeInteger(value);
    const isPositiveTimestamp = (value) => isSafeInteger(value) && value > 0;
    const MAX_TEMPLATES = 5;

    function validateTemplate(template, strict) {
        if (!template || typeof template !== 'object' || Array.isArray(template)) return '模板格式无效';
        if (strict && (!isSafeInteger(template.id) || template.id <= 0 || template.id >= MAX_SAFE)) return '模板 ID 无效';
        if (typeof template.name !== 'string' || !template.name.trim() || template.name.length > 20) return '模板名称无效';
        if (template.kind !== 'income' && template.kind !== 'expense') return '模板类型无效';
        if (typeof template.category !== 'string' || !template.category.trim()) return '模板分类无效';
        if (typeof template.note !== 'string' && template.note !== undefined) return '模板备注无效';
        if (typeof template.note === 'string' && template.note.length > 80) return '模板备注不能超过 80 个字符';
        if (strict && (typeof template.name !== 'string' || typeof template.category !== 'string'
            || typeof template.note !== 'string' || typeof template.expenseType !== 'string')) return '模板字段类型无效';
        if (template.kind === 'expense' && template.expenseType !== 'fixed' && template.expenseType !== 'flexible') return '模板支出类型无效';
        if (template.kind === 'income' && template.expenseType) return '收入模板不能设置支出性质';
        return null;
    }

    function validateTemplates(templates, strict) {
        if (!Array.isArray(templates) || templates.length > MAX_TEMPLATES) return '模板数量无效';
        const ids = new Set();
        const names = new Set();
        for (const template of templates) {
            const error = validateTemplate(template, strict);
            const name = template && typeof template.name === 'string' ? template.name.trim() : '';
            if (error) return error;
            if (strict && ids.has(template.id)) return '模板 ID 重复';
            if (names.has(name)) return '模板名称重复';
            if (strict) ids.add(template.id);
            if (name) names.add(name);
        }
        return null;
    }

    function draftFromSource(source, today) {
        if (!source || typeof source !== 'object' || !isValidIsoDate(today)) return null;
        if (source.kind !== 'income' && source.kind !== 'expense') return null;
        if (typeof source.category !== 'string' || !source.category.trim()) return null;
        if (source.kind === 'expense' && source.expenseType !== 'fixed' && source.expenseType !== 'flexible') return null;
        if (source.kind === 'income' && source.expenseType) return null;
        if (source.note !== undefined && typeof source.note !== 'string') return null;
        return {
            kind: source.kind,
            amountCents: 0,
            category: source.category,
            note: source.note || '',
            entryDate: today,
            expenseType: source.kind === 'expense' ? source.expenseType : '',
        };
    }

    function repeatEntryDraft(entry, today) { return draftFromSource(entry, today); }

    function templateDraft(template, today) {
        return validateTemplate(template, true) ? null : draftFromSource(template, today);
    }

    function migrateSnapshot(raw, importMonth) {
        if (raw && raw.schemaVersion === 2) {
            return { snapshot: Object.assign({}, raw, { schemaVersion: 3, templates: [] }), migrated: true };
        }
        if (raw && raw.schemaVersion === 3) return { snapshot: raw, migrated: false };
        if (raw && raw.schemaVersion !== undefined) throw new Error('不支持的备份版本');
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('备份格式无效');
        if (!Array.isArray(raw.entries)) throw new Error('流水必须是数组');
        const now = Date.now();
        const snapshot = Object.assign({}, raw, {
            schemaVersion: 3,
            settings: Object.assign({}, raw && raw.settings),
            entries: raw.entries.map((entry) => Object.assign({}, entry, {
                id: entry.id === undefined ? 0 : entry.id,
                createdAt: entry.createdAt === undefined ? now : entry.createdAt,
                updatedAt: entry.updatedAt === undefined ? now : entry.updatedAt,
                hourlyRateCentsPerHour: entry.hourlyRateCentsPerHour === undefined ? null : entry.hourlyRateCentsPerHour,
            })),
            templates: [],
            salaryHistory: [{ effectiveMonth: importMonth, monthlyTakeHomeCents: raw.settings.monthlyTakeHomeCents,
                createdAt: now, updatedAt: now }],
        });
        if (snapshot.settings.updatedAt === undefined) snapshot.settings.updatedAt = now;
        return { snapshot, migrated: true };
    }

    function validateEntry(entry, strict) {
        if (!entry || (entry.kind !== 'income' && entry.kind !== 'expense')) {
            return '流水类型无效';
        }
        if ((strict ? !isSafeInteger(entry.amountCents) : !Number.isInteger(number(entry.amountCents)))
            || !validPositive(entry.amountCents) || entry.amountCents > MAX_SAFE) {
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
        if (strict && (!Object.prototype.hasOwnProperty.call(entry, 'kind')
            || !Object.prototype.hasOwnProperty.call(entry, 'category')
            || !Object.prototype.hasOwnProperty.call(entry, 'note')
            || !Object.prototype.hasOwnProperty.call(entry, 'entryDate')
            || !Object.prototype.hasOwnProperty.call(entry, 'expenseType'))) return '流水字段缺失';
        if (typeof entry.note !== 'string' && entry.note !== undefined) return '备注无效';
        if (strict && typeof entry.note !== 'string') return '备注无效';
        if (typeof entry.note === 'string' && entry.note.length > 80) return '备注不能超过 80 个字符';
        if (strict && (typeof entry.kind !== 'string' || typeof entry.category !== 'string'
            || typeof entry.entryDate !== 'string' || typeof entry.expenseType !== 'string')) return '流水字段类型无效';
        if (strict) {
            if (!isSafeInteger(entry.id) || entry.id <= 0 || entry.id >= MAX_SAFE || !isPositiveTimestamp(entry.createdAt)
                || !isPositiveTimestamp(entry.updatedAt) || !Object.prototype.hasOwnProperty.call(entry, 'hourlyRateCentsPerHour')
                || (entry.hourlyRateCentsPerHour !== null && (!isSafeInteger(entry.hourlyRateCentsPerHour)
                    || entry.hourlyRateCentsPerHour <= 0))) return '流水元数据无效';
        }
        return null;
    }

    function validateSettings(settings, strict) {
        const required = [
            'monthlyTakeHomeCents', 'payMonths', 'workdaysPerMonth', 'onsiteHoursPerDay',
            'commuteHoursPerDay', 'overtimeHoursPerMonth', 'workCostCentsPerMonth',
            'fundGoalCents', 'fundCurrentCents',
        ];
        if (!settings || typeof settings !== 'object') {
            return '设置缺失';
        }
        for (const key of required) {
            if ((strict && typeof settings[key] !== 'number') || !validNonNegative(settings[key])
                || (key.endsWith('Cents') && (!isSafeInteger(settings[key]) || settings[key] > MAX_SAFE))) {
                return `设置项 ${key} 无效`;
            }
        }
        if (!validPositive(settings.payMonths) || !validPositive(settings.workdaysPerMonth)
            || !validPositive(number(settings.onsiteHoursPerDay) + number(settings.commuteHoursPerDay))) {
            return '工作时间设置必须大于 0';
        }
        return null;
    }

    function validateDraft(settings, entries) {
        const settingsError = validateSettings(settings, false);
        if (settingsError) {
            return { ok: false, error: settingsError };
        }
        if (!Array.isArray(entries)) {
            return { ok: false, error: '流水数据格式无效' };
        }
        for (const entry of entries) {
            const entryError = validateEntry(entry, false);
            if (entryError) {
                return { ok: false, error: entryError };
            }
        }
        return { ok: true };
    }

    function validateSnapshot(snapshot, options) {
        if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)
            || (snapshot.schemaVersion !== 2 && snapshot.schemaVersion !== 3)) {
            return { ok: false, error: '备份版本无效' };
        }
        const settingsError = validateSettings(snapshot.settings, true);
        if (settingsError || !isPositiveTimestamp(snapshot.settings.updatedAt)) {
            return { ok: false, error: settingsError || '设置时间戳无效' };
        }
        if (!Array.isArray(snapshot.entries) || !Array.isArray(snapshot.salaryHistory)) {
            return { ok: false, error: '备份数组格式无效' };
        }
        const templatesError = snapshot.schemaVersion === 3
            ? validateTemplates(snapshot.templates, true)
            : snapshot.templates === undefined ? null : validateTemplates(snapshot.templates, true);
        if (templatesError) return { ok: false, error: templatesError };
        if (options && options.requireMetadata && (!isPositiveTimestamp(snapshot.exportedAt)
            || typeof snapshot.appVersion !== 'string')) return { ok: false, error: '备份元数据无效' };
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const months = new Set(); const ids = new Set(); let latestSalary = null;
        for (const item of snapshot.salaryHistory) {
            if (!item || typeof item !== 'object' || !isValidIsoMonth(item.effectiveMonth)
                || item.effectiveMonth > currentMonth
                || !months.add(item.effectiveMonth) || !isSafeInteger(item.monthlyTakeHomeCents)
                || item.monthlyTakeHomeCents < 0 || !isPositiveTimestamp(item.createdAt)
                || !isPositiveTimestamp(item.updatedAt)) return { ok: false, error: '工资历史无效' };
            if (latestSalary === null || item.effectiveMonth > latestSalary.month) latestSalary = {
                month: item.effectiveMonth, salary: item.monthlyTakeHomeCents,
            };
        }
        const expectedSalary = latestSalary === null ? 0 : latestSalary.salary;
        if (snapshot.settings.monthlyTakeHomeCents !== expectedSalary) return { ok: false, error: '当前月薪与工资历史不一致' };
        for (const entry of snapshot.entries) {
            const entryError = validateEntry(entry, true);
            if (entryError || !ids.add(entry.id)) return { ok: false, error: entryError || '流水 ID 重复' };
        }
        return { ok: true };
    }

    function monthlySummary(snapshot, month, asOfMonth) {
        const settings = snapshot.settings;
        const entries = snapshot.entries.filter((entry) => entry.entryDate.indexOf(month) === 0);
        const extraIncomeCents = entries.filter((entry) => entry.kind === 'income')
            .reduce((sum, entry) => sum + entry.amountCents, 0);
        const fixedExpenseCents = entries.filter((entry) => entry.kind === 'expense' && entry.expenseType === 'fixed')
            .reduce((sum, entry) => sum + entry.amountCents, 0);
        const flexibleExpenseCents = entries.filter((entry) => entry.kind === 'expense' && entry.expenseType === 'flexible')
            .reduce((sum, entry) => sum + entry.amountCents, 0);
        const effectiveAsOfMonth = asOfMonth === undefined ? month : asOfMonth;
        const futureMonth = isValidIsoMonth(month) && isValidIsoMonth(effectiveAsOfMonth) && month > effectiveAsOfMonth;
        const salaryCents = Array.isArray(snapshot.salaryHistory)
            ? salaryForMonth(snapshot.salaryHistory, month, effectiveAsOfMonth)
            : futureMonth ? 0 : settings.monthlyTakeHomeCents;
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

    function prePurchaseDecision(snapshot, month, priceCents, asOfMonth) {
        if (!snapshot || !snapshot.settings || !Array.isArray(snapshot.entries)
            || !isValidIsoMonth(month) || (asOfMonth !== undefined && !isValidIsoMonth(asOfMonth))
            || !Number.isSafeInteger(priceCents) || !validPositive(priceCents)) return null;
        const summary = monthlySummary(snapshot, month, asOfMonth);
        const settings = snapshot.settings;
        const hourlyRateYuan = calculateHourly({
            salaryCents: settings.monthlyTakeHomeCents,
            payMonths: settings.payMonths,
            workdays: settings.workdaysPerMonth,
            onsiteHours: settings.onsiteHoursPerDay,
            commuteHours: settings.commuteHoursPerDay,
            overtimeHours: settings.overtimeHoursPerMonth,
            workCostCents: settings.workCostCentsPerMonth,
        });
        const fundGapCents = Math.max(0, settings.fundGoalCents - settings.fundCurrentCents);
        const fundGapReductionCents = Math.min(priceCents, fundGapCents);
        return {
            priceCents,
            hourlyRateYuan,
            workMinutes: workMinutesForAmount(priceCents, hourlyRateYuan),
            disposableBalanceCents: summary.balanceCents,
            balanceSharePercent: summary.balanceCents > 0 ? round(priceCents / summary.balanceCents * 100, 1) : null,
            fundGapCents,
            fundGapAfterNotBuyingCents: fundGapCents - fundGapReductionCents,
            fundGapReductionPercent: fundGapCents > 0 ? round(fundGapReductionCents / fundGapCents * 100, 1) : 0,
        };
    }

    function fundProjection(snapshot, month, months, asOfMonth) {
        const count = Number.isInteger(months) && months > 0 ? months : 6;
        const summary = monthlySummary(snapshot, month, asOfMonth);
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
        repeatEntryDraft,
        templateDraft,
        validateTemplates: (templates) => validateTemplates(templates, true),
        validateSnapshot,
        validateDraft,
        monthlySummary,
        prePurchaseDecision,
        fundProjection,
        scenarioResult,
        isValidIsoDate,
        isValidIsoMonth,
        workMinutesForRate,
        salaryForMonth,
        migrateSnapshot,
    };
});
