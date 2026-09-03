(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.WorkerLedgerSemantics = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
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
    function rememberUndo(entry, now, ttlMs) { return { entry, expiresAt: now + ttlMs }; }
    function takeUndo(undo, now) { return undo && now < undo.expiresAt ? undo.entry : null; }
    return { categoriesFor, defaultExpenseType, resolveExpenseType, rememberUndo, takeUndo };
});
