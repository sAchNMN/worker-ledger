const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('app/src/main/assets/index.html', 'utf8');
const app = fs.readFileSync('app/src/main/assets/app.js', 'utf8');

assert.doesNotMatch(html, /id=["']page-title["']/,
  'the topbar must not render a duplicate page title');
assert.doesNotMatch(app, /\$\('page-title'\)\.textContent/,
  'navigation must not update the removed duplicate page title');

for (const id of ['hourly-title', 'ledger-title', 'monthly-title', 'fund-title', 'discover-title']) {
  assert.match(html, new RegExp(`id=["']${id}["']`), `missing unique page title ${id}`);
}

console.log('page title contract passed');
