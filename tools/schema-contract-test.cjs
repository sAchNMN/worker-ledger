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
assert.match(source, /DATABASE_VERSION = 3/, 'template storage must use the v3 database schema');
assert.match(source, /templates_json TEXT NOT NULL/, 'settings must persist templates');
assert.match(source, /oldVersion < 3/, 'v2 databases must migrate template storage');

const repository = fs.readFileSync('app/src/main/java/com/workerledger/app/LedgerRepository.java', 'utf8');
assert.match(repository, /VERSION=3/, 'backups must use schema version 3');
assert.match(repository, /put\("templates"/, 'backups must include templates');
assert.match(repository, /put\("templateCount"/, 'import preview must include template count');

console.log('schema contract passed');
