const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const calculatorPath = path.join(__dirname, '..', 'app', 'src', 'main', 'assets', 'calculator.js');
assert.equal(fs.existsSync(calculatorPath), true, 'calculator.js must expose the shared calculation contract');

const {
  calculateHourly,
  workMinutesForAmount,
  validateSnapshot,
  monthlySummary,
  fundProjection,
  scenarioResult,
} = require(calculatorPath);

assert.equal(calculateHourly({
  salaryCents: 1000000,
  payMonths: 12,
  workdays: 20,
  onsiteHours: 8,
  commuteHours: 1,
  overtimeHours: 0,
  workCostCents: 0,
}), 55.56);
assert.equal(workMinutesForAmount(3200, 54.96), 35);
assert.equal(validateSnapshot({ settings: {}, entries: [] }).ok, false);

const snapshot = {
  settings: {
    monthlyTakeHomeCents: 1000000,
    payMonths: 12,
    workdaysPerMonth: 20,
    onsiteHoursPerDay: 8,
    commuteHoursPerDay: 1,
    overtimeHoursPerMonth: 0,
    workCostCentsPerMonth: 0,
    fundGoalCents: 10000000,
    fundCurrentCents: 200000,
  },
  entries: [
    { id: 1, kind: 'income', amountCents: 50000, category: '奖金', note: '', entryDate: '2026-09-03', expenseType: '' },
    { id: 2, kind: 'expense', amountCents: 30000, category: '房租', note: '', entryDate: '2026-09-03', expenseType: 'fixed' },
    { id: 3, kind: 'expense', amountCents: 12000, category: '吃饭', note: '', entryDate: '2026-09-03', expenseType: 'flexible' },
  ],
};
assert.equal(validateSnapshot(snapshot).ok, true);
const summary = monthlySummary(snapshot, '2026-09');
assert.deepEqual({
  salaryCents: summary.salaryCents,
  extraIncomeCents: summary.extraIncomeCents,
  fixedExpenseCents: summary.fixedExpenseCents,
  flexibleExpenseCents: summary.flexibleExpenseCents,
  balanceCents: summary.balanceCents,
}, {
  salaryCents: 1000000,
  extraIncomeCents: 50000,
  fixedExpenseCents: 30000,
  flexibleExpenseCents: 12000,
  balanceCents: 1008000,
});
assert.equal(fundProjection(snapshot, '2026-09', 2).points[2].cents, 2216000);
assert.equal(scenarioResult(snapshot.settings, { raisePercent: 10 }).scenario.hourly, 61.11);

console.log('smoke test passed');
