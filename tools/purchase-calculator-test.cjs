const assert = require('node:assert/strict');
const calc = require('../app/src/main/assets/calculator.js');
const fs = require('node:fs');

const snapshot = {
  settings: {
    monthlyTakeHomeCents: 1000000,
    payMonths: 12,
    workdaysPerMonth: 20,
    onsiteHoursPerDay: 8,
    commuteHoursPerDay: 1,
    overtimeHoursPerMonth: 0,
    workCostCentsPerMonth: 0,
    fundGoalCents: 1000000,
    fundCurrentCents: 400000,
  },
  salaryHistory: [{ effectiveMonth: '2026-01', monthlyTakeHomeCents: 1000000 }],
  entries: [
    { kind: 'income', amountCents: 50000, category: '奖金', entryDate: '2026-09-02', expenseType: '' },
    { kind: 'expense', amountCents: 200000, category: '房租', entryDate: '2026-09-03', expenseType: 'fixed' },
    { kind: 'expense', amountCents: 100000, category: '吃饭', entryDate: '2026-09-03', expenseType: 'flexible' },
  ],
};

const result = calc.prePurchaseDecision(snapshot, '2026-09', 30000, '2026-09');
assert.deepEqual(result, {
  priceCents: 30000,
  hourlyRateYuan: 55.56,
  workMinutes: 324,
  disposableBalanceCents: 750000,
  balanceSharePercent: 4,
  fundGapCents: 600000,
  fundGapAfterNotBuyingCents: 570000,
  fundGapReductionPercent: 5,
});

assert.equal(calc.prePurchaseDecision(snapshot, '2026-09', 0, '2026-09'), null);
assert.equal(calc.prePurchaseDecision(snapshot, '2026-09', -1, '2026-09'), null);
assert.equal(calc.prePurchaseDecision(snapshot, '2026-09', 30000.5, '2026-09'), null);
assert.equal(calc.prePurchaseDecision(snapshot, '2026-99', 30000, '2026-09'), null);

const negativeBalance = calc.prePurchaseDecision({
  ...snapshot,
  entries: snapshot.entries.concat({ kind: 'expense', amountCents: 800000, category: '其他', entryDate: '2026-09-04', expenseType: 'flexible' }),
}, '2026-09', 30000, '2026-09');
assert.equal(negativeBalance.balanceSharePercent, null);

const html = fs.readFileSync('app/src/main/assets/index.html', 'utf8');
const app = fs.readFileSync('app/src/main/assets/app.js', 'utf8');
for (const marker of ['purchase-form', 'purchase-amount', 'purchase-result', 'purchase-record', 'purchase-skip']) {
  assert.match(html, new RegExp(`id=["']${marker}["']`), `missing purchase UI ${marker}`);
}
for (const marker of ['prePurchaseDecision', 'renderPurchaseCalculator', 'purchase-record', 'purchase-skip']) {
  assert.match(app, new RegExp(marker), `missing purchase flow ${marker}`);
}
assert.match(app, /calc\.prePurchaseDecision\(state\.snapshot, asOfMonth\(\), state\.purchasePriceCents, asOfMonth\(\)\)/);
assert.match(app, /calc\.prePurchaseDecision\(state\.snapshot, asOfMonth\(\), priceCents, asOfMonth\(\)\)/);

console.log('purchase calculator behavior passed');
