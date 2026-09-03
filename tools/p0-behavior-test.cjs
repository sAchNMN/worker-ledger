const assert = require('node:assert/strict');
const calc = require('../app/src/main/assets/calculator.js');
const semantics = require('../app/src/main/assets/ledger-semantics.js');

assert.deepEqual(semantics.categoriesFor('income'), ['工资', '奖金', '兼职', '礼金', '报销', '其他']);
assert.equal(semantics.defaultExpenseType('房租'), 'fixed');
assert.equal(semantics.resolveExpenseType('房租', 'flexible', true), 'flexible');

assert.equal(calc.isValidIsoDate('2024-02-29'), true);
assert.equal(calc.isValidIsoDate('2026-02-30'), false);
assert.equal(calc.isValidIsoDate('2026-99-99'), false);
assert.equal(calc.isValidIsoMonth('2026-09'), true);
assert.equal(calc.isValidIsoMonth('2026-9'), false);
const validSnapshot = { settings: {
  monthlyTakeHomeCents: 1000000, payMonths: 12, workdaysPerMonth: 20,
  onsiteHoursPerDay: 8, commuteHoursPerDay: 1, overtimeHoursPerMonth: 0,
  workCostCentsPerMonth: 0, fundGoalCents: 0, fundCurrentCents: 0,
}, entries: [] };
assert.equal(calc.validateSnapshot({ ...validSnapshot, entries: [{ kind: 'expense', amountCents: 1,
  category: '吃饭', entryDate: '2026-02-30', expenseType: 'flexible' }] }).ok, false);
assert.equal(calc.validateSnapshot({ ...validSnapshot, entries: [{ kind: 'expense', amountCents: 1,
  category: '吃饭', entryDate: '2026-99-99', expenseType: 'flexible' }] }).ok, false);
const malformedDateSnapshot = { ...validSnapshot, entries: [{ kind: 'expense', amountCents: 1,
  category: '吃饭', entryDate: '2026-02-30', expenseType: 'flexible' }] };
const malformedDateOriginal = JSON.parse(JSON.stringify(malformedDateSnapshot));
assert.equal(calc.validateSnapshot(malformedDateSnapshot).ok, false);
assert.deepEqual(malformedDateSnapshot, malformedDateOriginal);

assert.equal(calc.workMinutesForRate(3200, 5496), 35);
assert.equal(calc.workMinutesForRate(3200, 7000), 27);
assert.equal(calc.calculateHourly({
  salaryCents: 1000000, payMonths: 12, workdays: 20, onsiteHours: 8,
  commuteHours: 1, overtimeHours: 0, workCostCents: 100000,
}), 50);
assert.equal(calc.calculateHourly({
  salaryCents: 100000, payMonths: 12, workdays: 20, onsiteHours: 8,
  commuteHours: 1, overtimeHours: 0, workCostCents: 200000,
}), null);
assert.equal(calc.calculateHourly({
  salaryCents: 1, payMonths: 1, workdays: 1, onsiteHours: 1,
  commuteHours: 0, overtimeHours: 0, workCostCents: 0,
}), null);

const history = [
  { effectiveMonth: '2026-03', monthlyTakeHomeCents: 900000 },
  { effectiveMonth: '2026-08', monthlyTakeHomeCents: 1000000 },
];
assert.equal(calc.salaryForMonth(history, '2026-02', '2026-09'), 0);
assert.equal(calc.salaryForMonth(history, '2026-04', '2026-09'), 900000);
assert.equal(calc.salaryForMonth(history, '2026-09', '2026-09'), 1000000);
assert.equal(calc.salaryForMonth(history, '2026-10', '2026-09'), 0);

const asOfSnapshot = {
  settings: { monthlyTakeHomeCents: 100000, payMonths: 12, workdaysPerMonth: 20,
    onsiteHoursPerDay: 8, commuteHoursPerDay: 1, overtimeHoursPerMonth: 0,
    workCostCentsPerMonth: 0, fundGoalCents: 1000000, fundCurrentCents: 0 },
  salaryHistory: [{ effectiveMonth: '2026-01', monthlyTakeHomeCents: 100000 }],
  entries: [],
};
assert.equal(calc.monthlySummary(asOfSnapshot, '2026-10', '2026-09').salaryCents, 0);
assert.equal(calc.monthlySummary(asOfSnapshot, '2026-10', '2026-10').salaryCents, 100000);
assert.deepEqual(calc.fundProjection(asOfSnapshot, '2026-10', 1, '2026-09').points.map((point) => point.cents), [0, 0]);
assert.deepEqual(calc.fundProjection(asOfSnapshot, '2026-10', 1, '2026-10').points.map((point) => point.cents), [0, 100000]);
assert.equal(semantics.monthlySummary(asOfSnapshot, '2026-10', '2026-09').salaryCents, 0);
assert.deepEqual(semantics.fundProjection(asOfSnapshot, '2026-10', 1, '2026-09').points.map((point) => point.cents), [0, 0]);
const legacyAsOfSnapshot = { settings: asOfSnapshot.settings, entries: [] };
assert.equal(calc.monthlySummary(legacyAsOfSnapshot, '2026-10', '2026-09').salaryCents, 0);

const strictSnapshot = {
  schemaVersion: 2,
  exportedAt: 1704067200000,
  appVersion: '1.0',
  settings: { ...asOfSnapshot.settings, updatedAt: 1704067200000 },
  salaryHistory: [{ effectiveMonth: '2024-01', monthlyTakeHomeCents: 100000,
    createdAt: 1704067200000, updatedAt: 1704067200000 }],
  entries: [{ id: 7, kind: 'expense', amountCents: 3200, category: '吃饭', note: '',
    entryDate: '2024-01-01', expenseType: 'flexible', createdAt: 1704067200000,
    updatedAt: 1704067200000, hourlyRateCentsPerHour: 5000 }],
};
assert.equal(calc.validateSnapshot(strictSnapshot, { requireMetadata: true }).ok, true);
assert.equal(calc.validateSnapshot({ ...strictSnapshot, schemaVersion: 3 }).ok, false);
assert.equal(calc.validateSnapshot({ ...strictSnapshot, entries: [{ ...strictSnapshot.entries[0], amountCents: Number.MAX_SAFE_INTEGER + 1 }] }).ok, false);
assert.equal(calc.validateSnapshot({ ...strictSnapshot, entries: [{ ...strictSnapshot.entries[0], note: 'x'.repeat(81) }] }).ok, false);
assert.equal(calc.validateSnapshot({ ...strictSnapshot, salaryHistory: [{ effectiveMonth: '2024-13', monthlyTakeHomeCents: 1, createdAt: 1704067200000, updatedAt: 1704067200000 }] }).ok, false);
assert.equal(calc.validateSnapshot({ ...strictSnapshot, salaryHistory: [{ effectiveMonth: '2099-01', monthlyTakeHomeCents: 100000, createdAt: 1704067200000, updatedAt: 1704067200000 }] }).ok, false);
assert.equal(calc.validateSnapshot({ ...strictSnapshot, settings: { ...strictSnapshot.settings, monthlyTakeHomeCents: 999999 } }).ok, false);
assert.equal(calc.validateSnapshot({ ...strictSnapshot, entries: [{ ...strictSnapshot.entries[0], note: 123 }] }).ok, false);
assert.equal(calc.validateSnapshot({ ...strictSnapshot, entries: [{ ...strictSnapshot.entries[0], category: 123 }] }).ok, false);
assert.equal(calc.validateSnapshot({ ...strictSnapshot, entries: [{ ...strictSnapshot.entries[0], kind: null }] }).ok, false);
assert.equal(calc.validateSnapshot({ ...strictSnapshot, entries: [{ ...strictSnapshot.entries[0], note: null }] }).ok, false);
assert.equal(calc.validateSnapshot({ ...strictSnapshot, entries: [{ ...strictSnapshot.entries[0], expenseType: null }] }).ok, false);
assert.equal(calc.validateSnapshot({ ...strictSnapshot, settings: { ...strictSnapshot.settings, payMonths: '12' } }).ok, false);
assert.equal(calc.validateSnapshot({ ...strictSnapshot, salaryHistory: [{ effectiveMonth: 202401, monthlyTakeHomeCents: 100000, createdAt: 1704067200000, updatedAt: 1704067200000 }] }).ok, false);
assert.equal(calc.calculateHourly({ salaryCents: 1, payMonths: 1, workdays: 1000,
  onsiteHours: 1, commuteHours: 0, overtimeHours: 0, workCostCents: 0 }), null);
assert.equal(calc.validateDraft(asOfSnapshot.settings, asOfSnapshot.entries).ok, true);

const legacy = calc.migrateSnapshot({
  settings: { monthlyTakeHomeCents: 1000000, payMonths: 12, workdaysPerMonth: 20,
    onsiteHoursPerDay: 8, commuteHoursPerDay: 1, overtimeHoursPerMonth: 0,
    workCostCentsPerMonth: 0, fundGoalCents: 0, fundCurrentCents: 0 },
  entries: [{ id: 7, kind: 'expense', amountCents: 3200, category: '吃饭',
    note: '', entryDate: '2026-09-03', expenseType: 'flexible' }],
}, '2026-09');
assert.equal(legacy.migrated, true);
assert.equal(legacy.snapshot.salaryHistory[0].effectiveMonth, '2026-09');
assert.equal(legacy.snapshot.entries.length, 1);

assert.throws(() => calc.migrateSnapshot({
  schemaVersion: 3,
  settings: validSnapshot.settings,
  entries: [],
}, '2026-09'), /不支持的备份版本/);
assert.throws(() => calc.migrateSnapshot({ settings: validSnapshot.settings, entries: {} }, '2026-09'), /流水必须是数组/);

const undo = semantics.rememberUndo({ id: 7 }, 1000, 5000);
assert.deepEqual(semantics.takeUndo(undo, 5999), { id: 7 });
assert.equal(semantics.takeUndo(undo, 6000), null);

console.log('p0 behavior tests passed');
