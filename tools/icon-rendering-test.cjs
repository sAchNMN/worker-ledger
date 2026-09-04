const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('app/src/main/assets/index.html', 'utf8');
const app = fs.readFileSync('app/src/main/assets/app.js', 'utf8');

assert.match(html, /class="metric-icon"><span data-icon="clock"><\/span>/);
assert.match(html, /class="metric-icon"><span data-icon="receipt"><\/span>/);
assert.match(html, /class="metric-icon"><span data-icon="seed"><\/span>/);
assert.match(
  app,
  /function renderStaticIcons\(\)[\s\S]*?querySelectorAll\('\[data-icon\]'\)[\s\S]*?innerHTML\s*=\s*icon\(/,
  'static data-icon placeholders must be filled with SVG markup',
);
assert.match(app, /function setup\(\)[\s\S]*?renderStaticIcons\(\);/,
  'static icons must be rendered during app initialization');

console.log('icon rendering contract passed');
