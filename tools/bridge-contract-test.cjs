const assert = require('node:assert/strict');
const fs = require('node:fs');

const manifest = fs.readFileSync('app/src/main/AndroidManifest.xml', 'utf8');
const activity = fs.readFileSync('app/src/main/java/com/workerledger/app/MainActivity.java', 'utf8');
assert.equal(fs.existsSync('app/src/main/java/com/workerledger/app/MainActivity.java'), true);
assert.equal(fs.existsSync('app/src/main/java/com/workerledger/app/LedgerBridge.java'), true);
assert.equal(manifest.includes('android.permission.INTERNET'), false, 'the APK must not request network access');
assert.match(activity, /import android\.webkit\.WebChromeClient;/, 'WebView must support JavaScript confirmation dialogs');
assert.match(activity, /setWebChromeClient\(new WebChromeClient\(\)\)/, 'WebView must install a Chrome client for import confirmation');

const bridge = fs.readFileSync('app/src/main/java/com/workerledger/app/LedgerBridge.java', 'utf8');
for (const method of ['loadSnapshot', 'saveSettings', 'saveTemplates', 'insertEntry', 'updateEntry', 'deleteEntry', 'requestExport', 'requestImport']) {
  assert.match(bridge, new RegExp(`\\b${method}\\s*\\(`), `bridge is missing ${method}`);
}

console.log('bridge contract passed');
