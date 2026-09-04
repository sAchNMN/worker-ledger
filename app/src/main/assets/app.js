(function () {
    'use strict';

    const calc = window.WorkerLedgerCalculator;
    const semantics = window.WorkerLedgerSemantics;
    const iconPaths = {
        dashboard: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h5A1.5 1.5 0 0 1 12 5.5v5a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 4 10.5v-5ZM16 5.5A1.5 1.5 0 0 1 17.5 4h5A1.5 1.5 0 0 1 24 5.5v5a1.5 1.5 0 0 1-1.5 1.5h-5a1.5 1.5 0 0 1-1.5-1.5v-5ZM4 18.5A1.5 1.5 0 0 1 5.5 17h5a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 4 23.5v-5ZM16 18.5a1.5 1.5 0 0 1 1.5-1.5h5a1.5 1.5 0 0 1-1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-5a1.5 1.5 0 0 1-1.5-1.5v-5Z" fill="none" stroke="currentColor" stroke-width="1.8"/>',
        clock: '<circle cx="14" cy="14" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M14 9v5l3.5 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
        wallet: '<path d="M5 7.5h15A2.5 2.5 0 0 1 22.5 10v9A2.5 2.5 0 0 1 20 21.5H6A2.5 2.5 0 0 1 3.5 19V7a2 2 0 0 1 2-2h13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M18 14h4.5M18 14a2 2 0 1 0 0 4h4.5" fill="none" stroke="currentColor" stroke-width="1.8"/>',
        calendar: '<rect x="4" y="5.5" width="20" height="19" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 3.5v4M20 3.5v4M4 10h20M9 15h2M15 15h2M9 19h2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
        seed: '<path d="M14 23V13M14 16c-5 0-7-3-7-7 5 0 7 3 7 7ZM14 13c0-5 3-7 7-7 0 5-2 7-7 7Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
        spark: '<path d="m14 3 1.7 7.3L23 12l-7.3 1.7L14 21l-1.7-7.3L5 12l7.3-1.7L14 3ZM22 19l.6 2.4L25 22l-2.4.6L22 25l-.6-2.4L19 22l2.4-.6L22 19Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
        download: '<path d="M14 4v13M9 12l5 5 5-5M5 21h18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
        upload: '<path d="M14 18V5M9 10l5-5 5 5M5 21h18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
        alert: '<path d="M14 4 3.7 22h20.6L14 4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 10v5M14 18.5v.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
        leaf: '<path d="M22 5C12 5 6 9 6 16c0 3 2 5 5 5 7 0 11-6 11-16Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M5 23c4-7 8-10 14-13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
        receipt: '<path d="M6 3.5h16v21l-3-2-3 2-3-2-3 2-4-2V3.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 9h8M10 13h8M10 17h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
        arrow: '<path d="M5 14h17M16 8l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
        plus: '<path d="M14 5v18M5 14h18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
        save: '<path d="M5 4h15l3 3v16H5V4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 4v6h8V4M9 23v-7h10v7" fill="none" stroke="currentColor" stroke-width="1.8"/>',
        train: '<path d="M7 18V8c0-3 3-4 7-4s7 1 7 4v10c0 2-2 3-7 3s-7-1-7-3Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 14h14M10 25l2-4M18 25l-2-4M11 9h.1M17 9h.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
        bolt: '<path d="m15 3-9 12h7l-1 10 9-13h-7l1-9Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
        info: '<circle cx="14" cy="14" r="10" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M14 12v6M14 8.5v.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
        edit: '<path d="m5 19-.7 4.7L9 23l13.3-13.3-4-4L5 19Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m15.5 7.5 4 4" stroke="currentColor" stroke-width="1.8"/>',
        trash: '<path d="M5 7h18M10 7V4h8v3M8 7l1 16h10l1-16M12 11v8M16 11v8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
    };
    const pageNames = { dashboard: '今日驾驶舱', hourly: '我的时薪', ledger: '10 秒记账', monthly: '月度总结', fund: '自由基金', discover: '有趣发现' };
    const defaults = {
        monthlyTakeHomeCents: 0, payMonths: 12, workdaysPerMonth: 21.75, onsiteHoursPerDay: 8,
        commuteHoursPerDay: 1, overtimeHoursPerMonth: 0, workCostCentsPerMonth: 0,
        fundGoalCents: 0, fundCurrentCents: 0,
    };
    const state = {
        phase: 'loading',
        snapshot: { settings: Object.assign({}, defaults), entries: [], templates: [] },
        activeView: 'dashboard',
        editingId: null,
        quickKind: 'expense',
        ledgerKind: 'expense',
        selectedMonth: '',
        purchasePriceCents: 0,
        purchasePrefillActive: false,
        toastTimer: null,
        undo: null,
        undoTimer: null,
        quickExpenseTypeOverride: false,
        ledgerExpenseTypeOverride: false,
    };

    const $ = (id) => document.getElementById(id);
    const safeNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
    const money = (value) => `¥${(safeNumber(value) / 100).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    const cents = (value) => Math.round(safeNumber(value) * 100);
    const todayIso = () => {
        const now = new Date();
        return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    };
    const currentMonth = () => state.selectedMonth || todayIso().slice(0, 7);
    const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
    const icon = (name) => `<svg viewBox="0 0 28 28" aria-hidden="true">${iconPaths[name] || ''}</svg>`;

    function renderStaticIcons() {
        document.querySelectorAll('[data-icon]').forEach((element) => {
            element.innerHTML = icon(element.getAttribute('data-icon'));
        });
    }

    const sortedEntries = () => state.snapshot.entries.slice().sort((a, b) => (b.entryDate || '').localeCompare(a.entryDate || '') || safeNumber(b.createdAt) - safeNumber(a.createdAt));
    const hourlyInput = (settings) => ({ salaryCents: settings.monthlyTakeHomeCents, payMonths: settings.payMonths, workdays: settings.workdaysPerMonth, onsiteHours: settings.onsiteHoursPerDay, commuteHours: settings.commuteHoursPerDay, overtimeHours: settings.overtimeHoursPerMonth, workCostCents: settings.workCostCentsPerMonth });
    const asOfMonth = () => todayIso().slice(0, 7);
    const summaryForMonth = (month) => semantics.monthlySummary(state.snapshot, month, asOfMonth());

    function setView(name) {
        state.activeView = pageNames[name] ? name : 'dashboard';
        document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view.id === `view-${state.activeView}`));
        document.querySelectorAll('[data-view]').forEach((button) => button.classList.toggle('active', button.getAttribute('data-view') === state.activeView));
        window.scrollTo(0, 0);
    }

    function showToast(message, isError, action, duration) {
        const toast = $('global-toast');
        if (!toast) return;
        toast.textContent = message;
        if (action) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'text-button';
            button.textContent = action.label;
            button.addEventListener('click', action.handler);
            toast.appendChild(document.createTextNode(' '));
            toast.appendChild(button);
        }
        toast.classList.toggle('error', Boolean(isError));
        toast.classList.add('show');
        window.clearTimeout(state.toastTimer);
        state.toastTimer = window.setTimeout(() => toast.classList.remove('show'), duration || 3200);
    }

    function showError(message) {
        const card = $('error-card');
        if (!card) return;
        card.classList.remove('hidden');
        $('error-message').textContent = message || '本地数据操作失败，请重试。';
    }

    function hideError() { $('error-card')?.classList.add('hidden'); }

    function parseEnvelope(raw) {
        try {
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return parsed && typeof parsed === 'object' ? parsed : { ok: false, error: '本地数据返回格式无效' };
        } catch (error) { return { ok: false, error: '本地数据返回格式无效' }; }
    }

    function nativeCall(method, ...args) {
        const bridge = window.AndroidBridge;
        if (!bridge || typeof bridge[method] !== 'function') return { ok: false, error: '本地数据接口不可用，请重新打开应用。' };
        try { return parseEnvelope(bridge[method](...args)); } catch (error) { return { ok: false, error: error.message || '本地数据操作失败' }; }
    }

    function loadSnapshot() {
        state.phase = 'loading';
        renderAll();
        const response = nativeCall('loadSnapshot');
        if (!response.ok) { state.phase = 'error'; showError(response.error); renderAll(); return false; }
        const validation = calc.validateSnapshot(response.data);
        if (!validation.ok) { state.phase = 'error'; showError(`本地数据校验失败：${validation.error}`); renderAll(); return false; }
        state.snapshot = response.data;
        state.phase = 'ready';
        hideError();
        renderAll();
        return true;
    }

    function setStatus(id, message, success) {
        const element = $(id);
        if (!element) return;
        element.textContent = message || '';
        element.classList.toggle('success', Boolean(success));
    }

    function formatMinutes(minutes) {
        if (!Number.isFinite(minutes)) return '—';
        const rounded = Math.max(1, Math.round(minutes));
        const hours = Math.floor(rounded / 60);
        const rest = rounded % 60;
        if (hours && rest) return `${hours} 小时 ${rest} 分钟`;
        if (hours) return `${hours} 小时`;
        return `${rest} 分钟`;
    }

    function entryMarkup(entry, withActions) {
        const minutes = entry.kind === 'expense'
            ? semantics.workMinutesForRate(entry.amountCents, entry.hourlyRateCentsPerHour) : null;
        const label = entry.note || entry.category;
        const detail = `${entry.category} · ${entry.entryDate}${entry.kind === 'expense' && entry.expenseType === 'fixed' ? ' · 固定' : ''}`;
        const time = minutes ? `≈ ${formatMinutes(minutes)}` : '';
        return `<div class="${withActions ? 'ledger-item' : 'recent-item'}"><div class="entry-badge ${entry.kind === 'expense' ? 'expense' : ''}">${icon(entry.kind === 'expense' ? 'receipt' : 'seed')}</div><div class="entry-main"><strong>${esc(label)}</strong><span>${esc(detail)}</span></div><div class="entry-amount ${entry.kind === 'income' ? 'income' : ''}"><strong>${entry.kind === 'income' ? '+' : '-'}${money(entry.amountCents)}</strong><span>${time}</span></div><div class="item-actions"><button type="button" data-repeat-entry="${entry.id}" aria-label="再记一笔 ${esc(label)}">${icon('plus')}</button>${withActions ? `<button type="button" data-edit-id="${entry.id}" aria-label="编辑 ${esc(label)}">${icon('edit')}</button><button type="button" data-delete-id="${entry.id}" aria-label="删除 ${esc(label)}">${icon('trash')}</button>` : ''}</div></div>`;
    }

    function renderDashboard() {
        const settings = state.snapshot.settings;
        const hourly = calc.calculateHourly(hourlyInput(settings));
        const summary = summaryForMonth(currentMonth());
        const todayExpense = state.snapshot.entries.filter((entry) => entry.kind === 'expense' && entry.entryDate === todayIso()).reduce((sum, entry) => sum + entry.amountCents, 0);
        const goal = settings.fundGoalCents;
        const progress = goal > 0 ? Math.min(100, Math.round(settings.fundCurrentCents / goal * 100)) : 0;
        $('dashboard-hourly').textContent = hourly === null ? '—' : `${money(Math.round(hourly * 100))}/时`;
        $('dashboard-hourly-note').textContent = hourly === null ? '先完成时薪设置' : '把通勤和加班也算进去了';
        $('dashboard-month-expense').textContent = money(summary.totalExpenseCents);
        $('dashboard-today-expense').textContent = `今日 ${money(todayExpense)}`;
        $('dashboard-fund-progress').textContent = `${progress}%`;
        $('dashboard-fund-meta').textContent = goal > 0 ? `已攒 ${money(settings.fundCurrentCents)} · 还差 ${money(Math.max(0, goal - settings.fundCurrentCents))}` : '还没有设置目标';
        const recent = $('dashboard-recent-list');
        if (state.phase === 'loading') recent.innerHTML = '<p class="recent-empty">正在读取本机数据…</p>';
        else if (!state.snapshot.entries.length) recent.innerHTML = '<p class="recent-empty">还没有记录，先记下今天花掉的第一笔时间。</p>';
        else recent.innerHTML = sortedEntries().slice(0, 4).map((entry) => entryMarkup(entry, false)).join('');
    }

    function renderPurchaseCalculator() {
        const input = $('purchase-amount');
        const resultCard = $('purchase-result');
        if (!input || !resultCard) return;
        if (document.activeElement !== input) input.value = state.purchasePriceCents > 0 ? state.purchasePriceCents / 100 : '';
        const result = state.purchasePriceCents > 0
            ? calc.prePurchaseDecision(state.snapshot, asOfMonth(), state.purchasePriceCents, asOfMonth()) : null;
        if (!result) {
            resultCard.classList.add('hidden');
            return;
        }
        resultCard.classList.remove('hidden');
        $('purchase-work-time').textContent = result.workMinutes === null ? '—' : formatMinutes(result.workMinutes);
        $('purchase-work-meta').textContent = result.hourlyRateYuan === null ? '先完成有效的时薪设置' : `按 ${result.hourlyRateYuan.toFixed(2)} 元/时计算`;
        $('purchase-balance-share').textContent = result.balanceSharePercent === null ? '—' : `${result.balanceSharePercent}%`;
        $('purchase-balance-meta').textContent = result.balanceSharePercent === null
            ? '本月结余为 0 或负数，暂不计算占比' : `本月可支配结余 ${money(result.disposableBalanceCents)}`;
        const fundReductionCents = result.fundGapCents - result.fundGapAfterNotBuyingCents;
        $('purchase-fund-gap').textContent = money(fundReductionCents);
        $('purchase-fund-meta').textContent = result.fundGapCents > 0
            ? `占剩余缺口 ${result.fundGapReductionPercent}%` : '自由基金已达到目标';
    }

    function renderHourly() {
        const settings = state.snapshot.settings;
        const values = { 'hourly-salary': settings.monthlyTakeHomeCents / 100, 'hourly-pay-months': settings.payMonths, 'hourly-workdays': settings.workdaysPerMonth, 'hourly-onsite': settings.onsiteHoursPerDay, 'hourly-commute': settings.commuteHoursPerDay, 'hourly-overtime': settings.overtimeHoursPerMonth, 'hourly-work-cost': settings.workCostCentsPerMonth / 100 };
        Object.keys(values).forEach((id) => { if ($(id) && document.activeElement !== $(id)) $(id).value = values[id]; });
        if (!$('hourly-effective-month').value) $('hourly-effective-month').value = todayIso().slice(0, 7);
        const hourly = calc.calculateHourly(hourlyInput(settings));
        const annualIncome = settings.monthlyTakeHomeCents * settings.payMonths;
        const annualCost = settings.workCostCentsPerMonth * 12;
        const annualHours = (settings.workdaysPerMonth * (settings.onsiteHoursPerDay + settings.commuteHoursPerDay) + settings.overtimeHoursPerMonth) * 12;
        const nominal = settings.workdaysPerMonth > 0 && settings.onsiteHoursPerDay > 0 ? settings.monthlyTakeHomeCents / 100 / (settings.workdaysPerMonth * settings.onsiteHoursPerDay) : null;
        $('hourly-real').textContent = hourly === null ? '—' : `${hourly.toFixed(2)} 元/时`;
        $('hourly-nominal').textContent = nominal === null ? '—' : `${nominal.toFixed(2)} 元/时`;
        $('hourly-difference').textContent = hourly === null ? '填写有效参数后展开计算。' : nominal > 0 ? `比名义时薪少 ${Math.max(0, (1 - hourly / nominal) * 100).toFixed(1)}%` : '名义时薪暂不可计算';
        $('hourly-formula').textContent = hourly === null ? '年度收入 = 月薪 × 发薪月数\n年度工作成本 = 每月工作成本 × 12\n年度时间成本需要大于 0。' : `年度收入 = ${money(annualIncome)}\n年度工作成本 = ${money(annualCost)}\n年度时间成本 = ${annualHours.toFixed(1)} 小时\n真实时薪 = (${money(annualIncome)} - ${money(annualCost)}) ÷ ${annualHours.toFixed(1)} = ${hourly.toFixed(2)} 元/时`;
    }

    function renderLedger() {
        $('ledger-count').textContent = `${state.snapshot.entries.length} 笔`;
        const list = $('ledger-list');
        list.innerHTML = state.snapshot.entries.length ? sortedEntries().map((entry) => entryMarkup(entry, true)).join('') : '<p class="list-empty">还没有流水。上面的表单可以在 10 秒内记下一笔。</p>';
    }

    function renderTemplates() {
        const templates = Array.isArray(state.snapshot.templates) ? state.snapshot.templates : [];
        $('template-count').textContent = `${templates.length}/5`;
        $('quick-templates').innerHTML = templates.length
            ? templates.map((template) => `<div class="template-item"><button type="button" class="template-use" data-use-template="${template.id}"><strong>${esc(template.name)}</strong><span>${esc(template.category)}${template.note ? ` · ${esc(template.note)}` : ''}</span></button><button type="button" class="template-delete" data-delete-template="${template.id}" aria-label="删除模板 ${esc(template.name)}">${icon('trash')}</button></div>`).join('')
            : '<p class="list-empty">还没有模板。填写分类和备注后，可以保存一个常用组合。</p>';
    }

    function renderMonthly() {
        const month = currentMonth();
        if ($('month-picker') && document.activeElement !== $('month-picker')) $('month-picker').value = month;
        const summary = summaryForMonth(month);
        $('monthly-total-income').textContent = money(summary.totalIncomeCents);
        $('monthly-income-breakdown').textContent = `工资 ${money(summary.salaryCents)} · 额外收入 ${money(summary.extraIncomeCents)}`;
        $('monthly-fixed-expense').textContent = money(summary.fixedExpenseCents);
        $('monthly-flexible-expense').textContent = money(summary.flexibleExpenseCents);
        const balance = $('monthly-balance');
        balance.textContent = money(summary.balanceCents);
        balance.classList.toggle('negative', summary.balanceCents < 0);
        $('monthly-balance-note').textContent = summary.balanceCents >= 0 ? '这个月还有余量' : '本月赤字，值得回看';
        const totals = {};
        summary.entries.filter((entry) => entry.kind === 'expense').forEach((entry) => { totals[entry.category] = (totals[entry.category] || 0) + entry.amountCents; });
        const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]);
        const max = rows.length ? rows[0][1] : 1;
        $('monthly-category-list').innerHTML = rows.length ? rows.map(([name, value]) => `<div class="category-row"><span class="category-name">${esc(name)}</span><div class="category-bar"><span style="width:${Math.round(value / max * 100)}%"></span></div><span class="category-value">${money(value)}</span></div>`).join('') : '<p class="list-empty">这个月还没有支出分类，月底再来看会更准确。</p>';
    }

    function renderFund() {
        const settings = state.snapshot.settings;
        const projection = semantics.fundProjection(state.snapshot, currentMonth(), 6, asOfMonth());
        const progress = settings.fundGoalCents > 0 ? Math.min(100, Math.round(settings.fundCurrentCents / settings.fundGoalCents * 100)) : 0;
        if ($('fund-goal') && document.activeElement !== $('fund-goal')) $('fund-goal').value = settings.fundGoalCents / 100;
        if ($('fund-current') && document.activeElement !== $('fund-current')) $('fund-current').value = settings.fundCurrentCents / 100;
        $('fund-progress-label').textContent = `${progress}%`;
        $('fund-progress-bar').style.width = `${progress}%`;
        $('fund-meta').textContent = settings.fundGoalCents > 0 ? `还差 ${money(Math.max(0, settings.fundGoalCents - settings.fundCurrentCents))}` : '先设置一个想要的自由基金目标';
        $('fund-safety').textContent = projection.safetyMonths === null ? '暂无支出样本，暂时无法估算安全垫月数。' : `按 ${currentMonth()} 总支出估算，你现在约有 ${projection.safetyMonths.toFixed(1)} 个月安全垫。`;
        const max = Math.max(1, projection.goalCents, ...projection.points.map((point) => point.cents));
        const left = 40, top = 24, width = 560, height = 208;
        const pointString = projection.points.map((point, index) => `${left + index / 6 * width},${top + height - point.cents / max * height}`).join(' ');
        $('fund-chart').querySelector('.chart-line').setAttribute('points', pointString);
        $('fund-chart').querySelector('.chart-grid').innerHTML = [0, 1, 2, 3].map((row) => `<line x1="${left}" x2="${left + width}" y1="${top + row / 3 * height}" y2="${top + row / 3 * height}"/>`).join('');
        $('fund-chart').querySelector('.chart-points').innerHTML = projection.points.map((point, index) => `<circle cx="${left + index / 6 * width}" cy="${top + height - point.cents / max * height}" r="5"/>`).join('');
        $('fund-chart').querySelector('.chart-labels').innerHTML = projection.points.map((point, index) => `<text x="${left + index / 6 * width}" y="${top + height + 25}">${index === 0 ? '现在' : `${index}月`}</text>`).join('');
    }

    function renderDiscover() {
        const summary = summaryForMonth(currentMonth());
        const settings = Object.assign({}, state.snapshot.settings, { monthlyExpenseCents: summary.totalExpenseCents, monthlyExtraIncomeCents: summary.extraIncomeCents });
        const scenarios = [
            ['scenario-commute', 'scenario-commute-value', 'scenario-commute-result', { commuteHours: safeNumber($('scenario-commute')?.value) }],
            ['scenario-overtime', 'scenario-overtime-value', 'scenario-overtime-result', { overtimeHours: safeNumber($('scenario-overtime')?.value) }],
            ['scenario-raise', 'scenario-raise-value', 'scenario-raise-result', { raisePercent: safeNumber($('scenario-raise')?.value) }],
        ];
        scenarios.forEach(([inputId, valueId, resultId, changes]) => {
            const input = $(inputId);
            if (!input) return;
            const value = safeNumber(input.value);
            $(valueId).textContent = inputId === 'scenario-raise' ? `${value}%` : `${value} 小时`;
            const outcome = calc.scenarioResult(settings, changes);
            const baseline = outcome.baseline.hourly;
            const result = outcome.scenario.hourly;
            $(resultId).textContent = result === null ? '—' : `${result.toFixed(2)} 元/时`;
            const deltaElement = $(resultId.replace('-result', '-delta'));
            const delta = result === null || baseline === null ? null : result - baseline;
            const prefix = delta !== null && delta >= 0 ? '+' : '';
            $(resultId.replace('-result', '-baseline')).textContent = baseline === null ? '基线 —' : `基线 ${baseline.toFixed(2)} 元/时`;
            deltaElement.textContent = delta === null ? '变化 —' : `变化 ${prefix}${delta.toFixed(2)} 元/时`;
            deltaElement.classList.toggle('positive', delta !== null && delta > 0);
            deltaElement.classList.toggle('negative', delta !== null && delta < 0);
        });
    }

    function renderAll() {
        renderDashboard();
        renderPurchaseCalculator();
        renderHourly();
        renderLedger();
        renderTemplates();
        renderMonthly();
        renderFund();
        renderDiscover();
        setView(state.activeView);
    }

    function setKind(form, kind) {
        const prefix = form.id === 'quick-form' ? 'quick' : 'ledger';
        state[`${prefix}Kind`] = kind;
        form.querySelectorAll('.segment').forEach((button) => button.classList.toggle('active', button.dataset.kind === kind));
        form.querySelectorAll('.expense-only').forEach((element) => element.classList.toggle('hidden', kind !== 'expense'));
        populateCategories(form, kind);
        state[`${prefix}ExpenseTypeOverride`] = false;
        applyExpenseType(form, false);
    }

    function populateCategories(form, kind, historicalCategory) {
        const select = form.querySelector('[id$="-category"]');
        const categories = semantics.categoriesFor(kind);
        const category = historicalCategory || (categories.includes(select.value) ? select.value : categories[0]);
        if (historicalCategory && !categories.includes(historicalCategory)) categories.unshift(historicalCategory);
        select.innerHTML = categories.map((item) => `<option value="${esc(item)}">${esc(item)}</option>`).join('');
        select.value = category;
    }

    function applyExpenseType(form, manualOverride) {
        const prefix = form.id === 'quick-form' ? 'quick' : 'ledger';
        const type = form.querySelector('[id$="-expense-type"]');
        const category = form.querySelector('[id$="-category"]').value;
        state[`${prefix}ExpenseTypeOverride`] = manualOverride;
        type.value = semantics.resolveExpenseType(category, type.value, manualOverride);
    }

    function entryFromForm(form, prefix) {
        const kind = state[`${prefix}Kind`];
        const id = prefix === 'ledger' ? safeNumber($('ledger-id').value) : 0;
        return { id, kind, amountCents: cents($(`${prefix}-amount`).value), category: $(`${prefix}-category`).value, note: $(`${prefix}-note`).value.trim(), entryDate: $(`${prefix}-date`).value, expenseType: kind === 'expense' ? $(`${prefix}-expense-type`).value : '' };
    }

    function applyQuickDraft(draft, message) {
        const form = $('quick-form');
        setKind(form, draft.kind);
        populateCategories(form, draft.kind, draft.category);
        $('quick-amount').value = '';
        $('quick-date').value = draft.entryDate;
        $('quick-note').value = draft.note;
        if (draft.kind === 'expense') {
            $('quick-expense-type').value = draft.expenseType;
            state.quickExpenseTypeOverride = true;
        }
        setStatus('quick-form-status', message, true);
        setView('dashboard');
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        $('quick-amount').focus();
    }

    function repeatEntry(id) {
        const entry = state.snapshot.entries.find((candidate) => candidate.id === id);
        const draft = semantics.repeatEntryDraft(entry, todayIso());
        if (!draft) { showToast('这笔流水无法再次带入。', true); return; }
        applyQuickDraft(draft, '已带入上一笔设置，金额留空，请确认后保存。');
    }

    function applyTemplate(id) {
        const template = (state.snapshot.templates || []).find((candidate) => candidate.id === id);
        const draft = semantics.templateDraft(template, todayIso());
        if (!draft) { showToast('模板已失效，请删除后重新保存。', true); return; }
        applyQuickDraft(draft, '已套用模板，金额留空，请填写后保存。');
    }

    function nextTemplateId(templates) {
        const used = new Set(templates.map((template) => safeNumber(template.id)));
        let id = Date.now();
        while (used.has(id) || id >= Number.MAX_SAFE_INTEGER) id += 1;
        return id;
    }

    function saveCurrentTemplate() {
        const name = $('template-name').value.trim();
        const templates = Array.isArray(state.snapshot.templates) ? state.snapshot.templates : [];
        const template = {
            id: nextTemplateId(templates),
            name,
            kind: state.quickKind,
            category: $('quick-category').value,
            note: $('quick-note').value.trim(),
            expenseType: state.quickKind === 'expense' ? $('quick-expense-type').value : '',
        };
        const validation = semantics.validateTemplates(templates.concat(template));
        if (!name || !validation.ok) {
            setStatus('template-status', !name ? '请输入模板名称。' : validation.error, false);
            return;
        }
        const response = nativeCall('saveTemplates', JSON.stringify(templates.concat(template)));
        if (!response.ok) { setStatus('template-status', `保存失败：${response.error}`, false); return; }
        $('template-name').value = '';
        setStatus('template-status', '模板已保存。', true);
        loadSnapshot();
    }

    function deleteTemplate(id) {
        const templates = (state.snapshot.templates || []).filter((template) => template.id !== id);
        const response = nativeCall('saveTemplates', JSON.stringify(templates));
        if (!response.ok) { showToast(`模板删除失败：${response.error}`, true); return; }
        loadSnapshot();
        showToast('模板已删除。');
    }

    function submitEntry(form, prefix) {
        const entry = entryFromForm(form, prefix);
        const entries = state.snapshot.entries.filter((candidate) => candidate.id !== entry.id).concat(entry);
        const validation = calc.validateDraft(state.snapshot.settings, entries);
        const statusId = `${prefix}-form-status`;
        if (!validation.ok) { setStatus(statusId, validation.error, false); return; }
        const button = $(`${prefix}-submit`);
        button.disabled = true;
        const response = nativeCall(entry.id ? 'updateEntry' : 'insertEntry', JSON.stringify(entry));
        button.disabled = false;
        if (!response.ok) { setStatus(statusId, `保存失败：${response.error}，请重试。`, false); return; }
        clearUndo();
        if (prefix === 'quick' && state.purchasePrefillActive) {
            state.purchasePriceCents = 0;
            state.purchasePrefillActive = false;
        }
        setStatus(statusId, '已保存', true);
        form.reset();
        if (prefix === 'quick') {
            $('quick-date').value = todayIso();
            setKind(form, 'expense');
        } else {
            $('ledger-id').value = '';
            $('ledger-date').value = todayIso();
            $('ledger-cancel').classList.add('hidden');
            $('ledger-submit').innerHTML = `${icon('plus')}记下这一笔`;
            state.editingId = null;
            setKind(form, 'expense');
        }
        loadSnapshot();
        const hourly = calc.calculateHourly(hourlyInput(state.snapshot.settings));
        showToast(entry.kind === 'expense' ? `已记下 ${money(entry.amountCents)}，约 ${formatMinutes(calc.workMinutesForAmount(entry.amountCents, hourly))} 的工作时间` : `已记下收入 ${money(entry.amountCents)}`);
    }

    function calculatePurchase(event) {
        event.preventDefault();
        const priceCents = cents($('purchase-amount').value);
        const result = calc.prePurchaseDecision(state.snapshot, asOfMonth(), priceCents, asOfMonth());
        if (!result) {
            state.purchasePriceCents = 0;
            setStatus('purchase-form-status', '请输入大于 0 的有效金额。', false);
            renderPurchaseCalculator();
            return;
        }
        state.purchasePriceCents = priceCents;
        setStatus('purchase-form-status', '换算完成，看看它要占用你多少时间。', true);
        renderPurchaseCalculator();
    }

    function recordPurchase() {
        if (!state.purchasePriceCents) return;
        setView('dashboard');
        setKind($('quick-form'), 'expense');
        $('quick-amount').value = state.purchasePriceCents / 100;
        $('quick-date').value = todayIso();
        state.purchasePrefillActive = true;
        if (Array.from($('quick-category').options).some((option) => option.value === '购物')) $('quick-category').value = '购物';
        applyExpenseType($('quick-form'), false);
        setStatus('quick-form-status', '金额已带入，请确认分类和支出性质后保存。', true);
        $('quick-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
        $('quick-amount').focus();
    }

    function skipPurchase() {
        state.purchasePriceCents = 0;
        state.purchasePrefillActive = false;
        setStatus('purchase-form-status', '', false);
        renderPurchaseCalculator();
        showToast('已跳过这次购买，没有写入流水');
    }

    function saveHourly(event) {
        event.preventDefault();
        const effectiveMonth = $('hourly-effective-month').value;
        if (!calc.isValidIsoMonth(effectiveMonth) || effectiveMonth > todayIso().slice(0, 7)) { setStatus('hourly-form-status', '工资生效月份必须是当前月或过去月份。', false); return; }
        const settings = { monthlyTakeHomeCents: cents($('hourly-salary').value), payMonths: safeNumber($('hourly-pay-months').value), workdaysPerMonth: safeNumber($('hourly-workdays').value), onsiteHoursPerDay: safeNumber($('hourly-onsite').value), commuteHoursPerDay: safeNumber($('hourly-commute').value), overtimeHoursPerMonth: safeNumber($('hourly-overtime').value), workCostCentsPerMonth: cents($('hourly-work-cost').value), fundGoalCents: state.snapshot.settings.fundGoalCents, fundCurrentCents: state.snapshot.settings.fundCurrentCents, salaryEffectiveMonth: effectiveMonth };
        const validation = calc.validateDraft(settings, state.snapshot.entries);
        if (!validation.ok) { setStatus('hourly-form-status', validation.error, false); return; }
        const button = $('hourly-save');
        button.disabled = true;
        const response = nativeCall('saveSettings', JSON.stringify(settings));
        button.disabled = false;
        if (!response.ok) { setStatus('hourly-form-status', `保存失败：${response.error}，请重试。`, false); return; }
        setStatus('hourly-form-status', '时薪参数已保存', true);
        loadSnapshot();
        showToast('时薪参数已更新，后续流水将使用新的时薪快照');
    }

    function saveFund(event) {
        event.preventDefault();
        const settings = Object.assign({}, state.snapshot.settings, { fundGoalCents: cents($('fund-goal').value), fundCurrentCents: cents($('fund-current').value) });
        delete settings.salaryEffectiveMonth;
        const validation = calc.validateDraft(settings, state.snapshot.entries);
        if (!validation.ok) { setStatus('fund-form-status', validation.error, false); return; }
        const response = nativeCall('saveSettings', JSON.stringify(settings));
        if (!response.ok) { setStatus('fund-form-status', `保存失败：${response.error}，请重试。`, false); return; }
        setStatus('fund-form-status', '基金进度已保存', true);
        loadSnapshot();
        showToast('自由基金进度已更新');
    }

    function editEntry(id) {
        const entry = state.snapshot.entries.find((candidate) => candidate.id === id);
        if (!entry) return;
        state.editingId = id;
        setView('ledger');
        $('ledger-id').value = entry.id;
        $('ledger-amount').value = entry.amountCents / 100;
        $('ledger-note').value = entry.note || '';
        $('ledger-date').value = entry.entryDate;
        $('ledger-submit').innerHTML = `${icon('save')}保存修改`;
        $('ledger-cancel').classList.remove('hidden');
        setKind($('ledger-form'), entry.kind);
        populateCategories($('ledger-form'), entry.kind, entry.category);
        $('ledger-expense-type').value = entry.expenseType || 'flexible';
        state.ledgerExpenseTypeOverride = true;
    }

    function deleteEntry(id) {
        if (!window.confirm('确定删除这笔流水吗？')) return;
        const response = nativeCall('deleteEntry', String(id));
        if (!response.ok) { showToast(`删除失败：${response.error}，请重试。`, true); return; }
        loadSnapshot();
        state.undo = semantics.rememberUndo(response.data, Date.now(), 5000);
        window.clearTimeout(state.undoTimer);
        state.undoTimer = window.setTimeout(clearUndo, 5000);
        showToast('流水已删除。', false, { label: '撤销', handler: restoreDeletedEntry }, 5000);
    }

    function clearUndo() {
        state.undo = null;
        window.clearTimeout(state.undoTimer);
        state.undoTimer = null;
    }

    function restoreDeletedEntry() {
        const entry = semantics.takeUndo(state.undo, Date.now());
        if (!entry) { clearUndo(); return; }
        const response = nativeCall('restoreEntry', JSON.stringify(entry));
        if (!response.ok) { showToast(`撤销失败：${response.error}，请重试。`, true); return; }
        clearUndo();
        loadSnapshot();
        showToast('流水已恢复');
    }

    function importPreviewMessage(preview) {
        const timestamp = typeof preview.exportedAt === 'number'
            ? preview.exportedAt
            : typeof preview.exportedAt === 'string' && preview.exportedAt.trim() ? Number(preview.exportedAt) : NaN;
        const exportedDate = Number.isFinite(timestamp) && timestamp > 0 ? new Date(timestamp) : null;
        const exportedAt = exportedDate && !Number.isNaN(exportedDate.getTime()) ? exportedDate.toLocaleString('zh-CN') : '未提供';
        const dateRange = preview.dateRange && typeof preview.dateRange === 'object' ? preview.dateRange : {};
        const start = typeof dateRange.start === 'string' && dateRange.start ? dateRange.start : '未提供';
        const end = typeof dateRange.end === 'string' && dateRange.end ? dateRange.end : '未提供';
        const entryCount = Number.isFinite(Number(preview.entryCount)) ? Number(preview.entryCount) : 0;
        const salaryHistoryCount = Number.isFinite(Number(preview.salaryHistoryCount)) ? Number(preview.salaryHistoryCount) : 0;
        const templateCount = Number.isFinite(Number(preview.templateCount)) ? Number(preview.templateCount) : 0;
        const version = preview.schemaVersion === 'legacy' ? '旧版/无版本' : `v${preview.schemaVersion ?? '未知'}`;
        return `备份版本：${version}\n导出时间：${exportedAt}\n流水：${entryCount} 笔\n日期范围：${start} 至 ${end}\n工资记录：${salaryHistoryCount} 条\n常用模板：${templateCount} 个\n\n确认后将替换当前本机数据。是否继续？`;
    }

    function setup() {
        renderStaticIcons();
        const iso = todayIso();
        $('quick-date').value = iso;
        $('ledger-date').value = iso;
        state.selectedMonth = iso.slice(0, 7);
        $('month-picker').value = state.selectedMonth;
        const date = new Date(`${iso}T00:00:00`);
        $('today-label').textContent = `${date.getMonth() + 1}月${date.getDate()}日`;
        document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => setView(button.getAttribute('data-view'))));
        document.querySelectorAll('#quick-form .segment, #ledger-form .segment').forEach((button) => button.addEventListener('click', () => setKind(button.closest('form'), button.dataset.kind)));
        $('quick-form').addEventListener('submit', (event) => { event.preventDefault(); submitEntry($('quick-form'), 'quick'); });
        $('template-save').addEventListener('click', saveCurrentTemplate);
        $('quick-templates').addEventListener('click', (event) => {
            const use = event.target.closest('[data-use-template]');
            const remove = event.target.closest('[data-delete-template]');
            if (use) applyTemplate(Number(use.dataset.useTemplate));
            if (remove) deleteTemplate(Number(remove.dataset.deleteTemplate));
        });
        $('purchase-form').addEventListener('submit', calculatePurchase);
        $('purchase-record').addEventListener('click', recordPurchase);
        $('purchase-skip').addEventListener('click', skipPurchase);
        $('ledger-form').addEventListener('submit', (event) => { event.preventDefault(); submitEntry($('ledger-form'), 'ledger'); });
        $('ledger-cancel').addEventListener('click', () => { $('ledger-form').reset(); $('ledger-id').value = ''; $('ledger-date').value = iso; $('ledger-cancel').classList.add('hidden'); $('ledger-submit').innerHTML = `${icon('plus')}记下这一笔`; state.editingId = null; setKind($('ledger-form'), 'expense'); });
        $('hourly-form').addEventListener('submit', saveHourly);
        $('fund-form').addEventListener('submit', saveFund);
        $('retry-button').addEventListener('click', loadSnapshot);
        ['quick', 'ledger'].forEach((prefix) => {
            $(`${prefix}-category`).addEventListener('change', () => applyExpenseType($(`${prefix}-form`), false));
            $(`${prefix}-expense-type`).addEventListener('change', () => { state[`${prefix}ExpenseTypeOverride`] = true; });
        });
        $('export-button').addEventListener('click', () => { if (!window.AndroidBridge) { showToast('本地数据接口不可用', true); return; } window.AndroidBridge.requestExport(); });
        $('import-button').addEventListener('click', () => { if (!window.AndroidBridge) { showToast('本地数据接口不可用', true); return; } window.AndroidBridge.requestImport(); });
        $('month-picker').addEventListener('change', (event) => { state.selectedMonth = event.target.value || iso.slice(0, 7); renderAll(); });
        ['scenario-commute', 'scenario-overtime', 'scenario-raise'].forEach((id) => $(id).addEventListener('input', renderDiscover));
        $('formula-toggle').addEventListener('click', () => { const formula = $('hourly-formula'); const hidden = formula.classList.toggle('hidden'); $('formula-toggle').textContent = hidden ? '展开' : '收起'; });
        ['dashboard-recent-list', 'ledger-list'].forEach((id) => $(id).addEventListener('click', (event) => {
            const repeat = event.target.closest('[data-repeat-entry]');
            if (repeat) repeatEntry(Number(repeat.dataset.repeatEntry));
            if (id !== 'ledger-list') return;
            const edit = event.target.closest('[data-edit-id]');
            const remove = event.target.closest('[data-delete-id]');
            if (edit) editEntry(Number(edit.dataset.editId));
            if (remove) deleteEntry(Number(remove.dataset.deleteId));
        }));
        window.AppNative = {
            onExportResult(ok, message) { showToast(message, !ok); },
            onImportResult(ok, message, snapshotJson) { if (!ok) { showToast(message, true); return; } try { state.snapshot = JSON.parse(snapshotJson); state.phase = 'ready'; renderAll(); showToast(message); } catch (error) { showToast('导入后的数据无法显示，请重试。', true); } },
            onImportPreview(ok, message, previewJson) {
                if (!ok) { showToast(message, true); return; }
                try {
                    const preview = JSON.parse(previewJson);
                    if (window.confirm(importPreviewMessage(preview))) window.AndroidBridge.confirmImport();
                    else nativeCall('cancelImport');
                } catch (error) { nativeCall('cancelImport'); showToast('导入预览无法显示，已取消导入。', true); }
            },
        };
        setKind($('quick-form'), 'expense');
        setKind($('ledger-form'), 'expense');
        renderAll();
        loadSnapshot();
    }

    document.addEventListener('DOMContentLoaded', setup);
})();
