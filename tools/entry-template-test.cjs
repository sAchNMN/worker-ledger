const assert = require('node:assert/strict');
const fs = require('node:fs');
const calc = require('../app/src/main/assets/calculator.js');
const semantics = require('../app/src/main/assets/ledger-semantics.js');

const sourceEntry = {
  id: 7,
  kind: 'expense',
  amountCents: 3200,
  category: '房租',
  note: '九月房租',
  entryDate: '2026-08-01',
  expenseType: 'fixed',
};
assert.deepEqual(semantics.repeatEntryDraft(sourceEntry, '2026-09-04'), {
  kind: 'expense',
  amountCents: 0,
  category: '房租',
  note: '九月房租',
  entryDate: '2026-09-04',
  expenseType: 'fixed',
});
assert.deepEqual(semantics.repeatEntryDraft({ ...sourceEntry, kind: 'income', category: '工资', expenseType: '' }, '2026-09-04'), {
  kind: 'income',
  amountCents: 0,
  category: '工资',
  note: '九月房租',
  entryDate: '2026-09-04',
  expenseType: '',
});
assert.equal(semantics.repeatEntryDraft(null, '2026-09-04'), null);

const template = {
  id: 11,
  name: '工作日午餐',
  kind: 'expense',
  category: '吃饭',
  note: '工作日午餐',
  expenseType: 'flexible',
};
assert.deepEqual(semantics.templateDraft(template, '2026-09-04'), {
  kind: 'expense',
  amountCents: 0,
  category: '吃饭',
  note: '工作日午餐',
  entryDate: '2026-09-04',
  expenseType: 'flexible',
});
assert.equal(semantics.validateTemplates([template]).ok, true);
assert.equal(semantics.validateTemplates(Array.from({ length: 6 }, (_, index) => ({
  ...template,
  id: index + 1,
}))).ok, false);
assert.equal(semantics.validateTemplates([{ ...template, id: 12, name: '   ' }]).ok, false);
assert.equal(semantics.validateTemplates([{ ...template, id: 12, expenseType: 'invalid' }]).ok, false);
assert.equal(semantics.validateTemplates([template, { ...template, id: 12 }]).ok, false);

const snapshot = {
  schemaVersion: 3,
  exportedAt: 1704067200000,
  appVersion: '1.1',
  settings: {
    monthlyTakeHomeCents: 100000,
    payMonths: 12,
    workdaysPerMonth: 20,
    onsiteHoursPerDay: 8,
    commuteHoursPerDay: 1,
    overtimeHoursPerMonth: 0,
    workCostCentsPerMonth: 0,
    fundGoalCents: 0,
    fundCurrentCents: 0,
    updatedAt: 1704067200000,
  },
  salaryHistory: [{
    effectiveMonth: '2024-01',
    monthlyTakeHomeCents: 100000,
    createdAt: 1704067200000,
    updatedAt: 1704067200000,
  }],
  templates: [template],
  entries: [],
};
assert.equal(calc.validateSnapshot(snapshot, { requireMetadata: true }).ok, true);
assert.equal(calc.validateSnapshot({ ...snapshot, templates: snapshot.templates.concat({
  ...template,
  id: 12,
  name: '第二个模板',
}) }).ok, true);
assert.equal(calc.validateSnapshot({ ...snapshot, templates: Array.from({ length: 6 }, (_, index) => ({
  ...template,
  id: index + 1,
})), }).ok, false);

const html = fs.readFileSync('app/src/main/assets/index.html', 'utf8');
const app = fs.readFileSync('app/src/main/assets/app.js', 'utf8');
for (const marker of ['quick-templates', 'template-name', 'template-save']) {
  assert.match(html, new RegExp(`id=["']${marker}["']`), `missing template UI ${marker}`);
}
for (const marker of ['repeat-entry', 'repeatEntryDraft', 'templateDraft', 'saveTemplates', 'deleteTemplate']) {
  assert.match(app, new RegExp(marker), `missing entry template flow ${marker}`);
}

console.log('entry template behavior passed');
