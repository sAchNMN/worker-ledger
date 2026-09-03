const assert = require('node:assert/strict');
const fs = require('node:fs');

const manifest = fs.readFileSync('app/src/main/AndroidManifest.xml', 'utf8');
assert.equal(fs.existsSync('app/src/main/java/com/workerledger/app/MainActivity.java'), true);
assert.equal(fs.existsSync('app/src/main/java/com/workerledger/app/LedgerBridge.java'), true);
assert.equal(manifest.includes('android.permission.INTERNET'), false, 'the APK must not request network access');

const bridge = fs.readFileSync('app/src/main/java/com/workerledger/app/LedgerBridge.java', 'utf8');
for (const method of ['loadSnapshot', 'saveSettings', 'insertEntry', 'updateEntry', 'deleteEntry', 'requestExport', 'requestImport']) {
  assert.match(bridge, new RegExp(`\\b${method}\\s*\\(`), `bridge is missing ${method}`);
}

console.log('bridge contract passed');
