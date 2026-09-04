(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory(require('./calculator.js'));
    else root.WorkerLedgerSemantics = factory(root.WorkerLedgerCalculator);
})(typeof globalThis === 'object' ? globalThis : this, function (calculator) {
    'use strict';
    const categories = {
        income: ['工资', '奖金', '兼职', '礼金', '报销', '其他'],
        expense: ['吃饭', '交通', '购物', '娱乐', '房租', '其他'],
    };
    function categoriesFor(kind) { return (categories[kind] || []).slice(); }
    function defaultExpenseType(category) { return category === '房租' ? 'fixed' : 'flexible'; }
    function resolveExpenseType(category, currentType, manualOverride) {
        return manualOverride && (currentType === 'fixed' || currentType === 'flexible')
            ? currentType : defaultExpenseType(category);
    }
    function repeatEntryDraft(entry, today) { return calculator.repeatEntryDraft(entry, today); }
    function templateDraft(template, today) { return calculator.templateDraft(template, today); }
    function validateTemplates(templates) {
        const error = calculator.validateTemplates(templates);
        return error ? { ok: false, error } : { ok: true };
    }
    function rememberUndo(entry, now, ttlMs) { return { entry, expiresAt: now + ttlMs }; }
    function takeUndo(undo, now) { return undo && now < undo.expiresAt ? undo.entry : null; }
    return {
        categoriesFor,
        defaultExpenseType,
        resolveExpenseType,
        repeatEntryDraft,
        templateDraft,
        validateTemplates,
        rememberUndo,
        takeUndo,
        workMinutesForRate: calculator.workMinutesForRate,
        monthlySummary: calculator.monthlySummary,
        fundProjection: calculator.fundProjection,
    };
});
