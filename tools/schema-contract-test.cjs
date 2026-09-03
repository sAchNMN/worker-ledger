const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync(
  'app/src/main/java/com/workerledger/app/LedgerDbHelper.java',
  'utf8',
);

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

console.log('schema contract passed');
