const assert = require('node:assert/strict');
const fs = require('node:fs');

const app = fs.readFileSync('app/src/main/assets/app.js', 'utf8');
const html = fs.readFileSync('app/src/main/assets/index.html', 'utf8');
for (const marker of ['loadSnapshot', 'AndroidBridge', 'onImportResult', 'onExportResult', 'quick-form', 'dashboard-recent-list']) {
  assert.match(app + html, new RegExp(marker), `missing app flow ${marker}`);
}
assert.match(app, /dashboard-recent-list/);
assert.match(app, /insertEntry/);
assert.match(app, /updateEntry/);
assert.match(app, /deleteEntry/);
assert.match(app, /slice\(0,\s*4\)/);

console.log('app flow contract passed');
