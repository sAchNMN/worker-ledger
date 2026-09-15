const assert = require('node:assert/strict');
const fs = require('node:fs');

const policyPath = 'app/src/main/assets/privacy.html';
assert.equal(fs.existsSync(policyPath), true, 'privacy.html must exist');
assert.equal(fs.existsSync('app/src/main/assets/index.html'), true, 'index.html must exist');

const html = fs.readFileSync('app/src/main/assets/index.html', 'utf8');
assert.match(html, /id=["']privacy-button["']/, 'missing privacy-button');

const js = fs.readFileSync('app/src/main/assets/app.js', 'utf8');
assert.match(js, /\$\('privacy-button'\)\.addEventListener\('click'/, 'privacy-button must be wired');

const policy = fs.readFileSync(policyPath, 'utf8');
assert.match(policy, /history\.back\(\)/, 'policy must offer a way back to the app');
for (const marker of [
  '不收集任何个人信息',
  '未申请任何 Android 系统权限',
  '未集成任何第三方 SDK',
]) {
  assert.match(policy, new RegExp(marker), `missing ${marker}`);
}
assert.doesNotMatch(
  policy,
  /(?:href|src)=["']https?:/i,
  'policy must not link out: the app has no INTERNET permission and LocalAssetClient drops every external navigation',
);

console.log('privacy entry contract passed');
