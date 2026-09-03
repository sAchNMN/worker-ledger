const assert = require('node:assert/strict');
const fs = require('node:fs');

assert.equal(fs.existsSync('app/src/main/assets/index.html'), true, 'index.html must exist');
assert.equal(fs.existsSync('app/src/main/assets/styles.css'), true, 'styles.css must exist');
assert.equal(fs.existsSync('app/src/main/assets/app.js'), true, 'app.js must exist');

const html = fs.readFileSync('app/src/main/assets/index.html', 'utf8');
for (const id of ['view-dashboard', 'view-hourly', 'view-ledger', 'view-monthly', 'view-fund', 'view-discover']) {
  assert.match(html, new RegExp(`id=["']${id}["']`), `missing ${id}`);
}
for (const marker of ['desktop-sidebar', 'mobile-nav', 'global-toast', 'error-card', '<svg']) {
  assert.match(html, new RegExp(marker.replace(/[<>]/g, '\\$&')), `missing ${marker}`);
}

const css = fs.readFileSync('app/src/main/assets/styles.css', 'utf8');
assert.match(css, /@media\s*\(max-width:\s*760px\)/);
assert.match(css, /@media\s*\(min-width:\s*761px\)/);

console.log('ui contract passed');
