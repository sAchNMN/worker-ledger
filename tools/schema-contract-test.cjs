const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('app/src/main/java/com/workerledger/app/LedgerDbHelper.java', 'utf8');
const models = fs.readFileSync('app/src/main/java/com/workerledger/app/LedgerModels.java', 'utf8');

assert.match(
  source,
  /"updated_at INTEGER NOT NULL\)"\);/g,
  'every CREATE TABLE statement must close its parenthesized column list',
);
assert.equal(
  (source.match(/"updated_at INTEGER NOT NULL\)"\);/g) || []).length,
  2,
  'both local tables must have complete CREATE TABLE SQL',
);
assert.match(models, /instanceof Number/, 'strict JSON parsing must inspect raw numeric types');
assert.match(models, /instanceof String/, 'strict JSON parsing must inspect raw string types');
assert.match(models, /fromStrictJson/, 'strict model parsers must be separate from form parsers');

console.log('schema contract passed');
