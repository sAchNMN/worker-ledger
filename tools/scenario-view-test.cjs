const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('app/src/main/assets/index.html', 'utf8');
const app = fs.readFileSync('app/src/main/assets/app.js', 'utf8');
for (const name of ['commute', 'overtime', 'raise']) {
  assert.match(html, new RegExp(`scenario-${name}-baseline`), `missing ${name} baseline output`);
  assert.match(html, new RegExp(`scenario-${name}-delta`), `missing ${name} delta output`);
}
assert.match(app, /baseline\.hourly/);
assert.match(app, /replace\('-result', '-delta'\)/);

console.log('scenario view contract passed');
