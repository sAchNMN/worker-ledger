const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('app/src/main/assets/index.html', 'utf8');

function attributes(id) {
  const match = source.match(new RegExp(`<input id="${id}"[^>]*>`));
  assert.ok(match, `missing input ${id}`);
  const min = Number(match[0].match(/\bmin="([^"]+)"/)[1]);
  const step = Number(match[0].match(/\bstep="([^"]+)"/)[1]);
  return { min, step };
}

function assertValidDefault(id, value) {
  const { min, step } = attributes(id);
  const steps = (value - min) / step;
  assert.ok(
    Math.abs(steps - Math.round(steps)) < 1e-9,
    `${id} default ${value} is not aligned to min ${min} and step ${step}`,
  );
}

assertValidDefault('hourly-pay-months', 12);
assertValidDefault('hourly-workdays', 21.75);

console.log('input constraint passed');
