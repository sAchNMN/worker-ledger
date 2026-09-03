# 打工人小账本 P0 正确性修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复打工人小账本的分类、日期、历史时薪、工资月份、备份迁移、导入事务和删除撤销语义，并在不能进行真机验证的地方明确留下验证边界。

**Architecture:** 保留原生 Java + SQLite + 内嵌 WebView 的最小架构。把可在 Node 中验证的日期、工资历史、时薪快照和表单默认规则放入纯 JavaScript 模块；Android 层负责同等强度的原生校验、SQLite v2 迁移、事务导入和 Bridge 文件流程；页面层只消费版本化快照。

**Tech Stack:** Java 8、Android SDK API 34、SQLiteOpenHelper、WebView、原生 HTML/CSS/JavaScript、Node.js 内置 `assert`。

**Spec:** `docs/superpowers/specs/2026-09-03-ledger-p0-correctness-design.md`

## Global Constraints

- 不引入网络、登录、云同步、第三方 UI、第三方数据库或测试框架依赖。
- 所有金额继续以整数分保存；时薪快照以“每小时的分”保存。
- 日期必须是真实公历日期，不能只用正则表达式。
- 未来月份月度工资为 0；工资生效月份只能是当前月或过去月份。
- 新流水保存时薪快照；编辑流水不得用当前时薪覆盖原快照。
- 导入必须先预览和确认，确认后的替换必须在 SQLite 事务内完成。
- `android:allowBackup` 必须为 `false`，Manifest 不得声明网络权限。
- 不生成、不提交、不输出 Release keystore 内容；`keystore.properties` 必须被 Git 忽略。
- 现有未提交的 `app.js`、`index.html`、`styles.css`、`tools/ui-contract-test.cjs` 和 `media/` 属于既有改动；不得使用 `git add .` 或覆盖它们的无关部分。

## File Map

- Create: `app/src/main/assets/ledger-semantics.js` — 收入/支出分类、房租默认性质和短时撤销的纯函数。
- Modify: `app/src/main/assets/calculator.js` — 严格日期/月校验、版本化快照校验、工资历史选择和历史时薪换算。
- Modify: `app/src/main/assets/app.js` — 使用版本化快照、分类切换、工资生效月份、时薪快照渲染、导入确认和撤销交互。
- Modify: `app/src/main/assets/index.html` — 两套分类选项、工资生效月份输入。
- Modify: `app/src/main/java/com/workerledger/app/LedgerModels.java` — 时薪快照和工资生效月份字段。
- Modify: `app/src/main/java/com/workerledger/app/LedgerDbHelper.java` — SQLite schema v2、旧库迁移和旧流水快照回填。
- Modify: `app/src/main/java/com/workerledger/app/LedgerRepository.java` — 版本化快照、工资历史、原生校验、导入事务和恢复接口。
- Modify: `app/src/main/java/com/workerledger/app/LedgerBridge.java` — 导出元数据、导入预览/确认、删除返回值和恢复接口。
- Modify: `app/src/main/AndroidManifest.xml` — 关闭系统备份并保持无权限边界。
- Modify: `app/build.gradle` — 递增 `versionCode`，提供不含密钥的可选 Release 签名配置。
- Modify: `.gitignore` — 忽略本地 keystore 配置和密钥文件。
- Modify: `README.md` — 更新备份版本、迁移假设、系统备份和 Release 签名说明。
- Create: `tools/p0-behavior-test.cjs` — Node 行为测试；不通过读取源代码字符串来伪造功能验证。
- Modify: `tools/smoke-test.cjs` — 让既有计算自检使用 v2 快照契约。

---

### Task 1: 建立纯函数行为契约并完成 RED-GREEN

**Files:**
- Create: `app/src/main/assets/ledger-semantics.js`
- Modify: `app/src/main/assets/calculator.js`
- Create: `tools/p0-behavior-test.cjs`
- Modify: `tools/smoke-test.cjs`

**Interfaces:**
- `WorkerLedgerSemantics.categoriesFor(kind) -> string[]`
- `WorkerLedgerSemantics.defaultExpenseType(category) -> 'fixed' | 'flexible'`
- `WorkerLedgerSemantics.resolveExpenseType(category, currentType, manualOverride) -> 'fixed' | 'flexible'`
- `WorkerLedgerSemantics.rememberUndo(entry, now, ttlMs) -> { entry, expiresAt }`
- `WorkerLedgerSemantics.takeUndo(undo, now) -> object | null`
- `WorkerLedgerCalculator.isValidIsoDate(value) -> boolean`
- `WorkerLedgerCalculator.isValidIsoMonth(value) -> boolean`
- `WorkerLedgerCalculator.workMinutesForRate(amountCents, hourlyRateCentsPerHour) -> number | null`
- `WorkerLedgerCalculator.salaryForMonth(salaryHistory, month, asOfMonth) -> number`
- `WorkerLedgerCalculator.migrateSnapshot(raw, importMonth) -> { snapshot, migrated }`

- [ ] **Step 1: Write the failing behavior tests**

```javascript
const assert = require('node:assert/strict');
const calc = require('../app/src/main/assets/calculator.js');
const semantics = require('../app/src/main/assets/ledger-semantics.js');

assert.deepEqual(semantics.categoriesFor('income'), ['工资', '奖金', '兼职', '礼金', '报销', '其他']);
assert.equal(semantics.defaultExpenseType('房租'), 'fixed');
assert.equal(semantics.resolveExpenseType('房租', 'flexible', true), 'flexible');

assert.equal(calc.isValidIsoDate('2024-02-29'), true);
assert.equal(calc.isValidIsoDate('2026-02-30'), false);
assert.equal(calc.isValidIsoDate('2026-99-99'), false);
assert.equal(calc.isValidIsoMonth('2026-09'), true);
assert.equal(calc.isValidIsoMonth('2026-9'), false);

assert.equal(calc.workMinutesForRate(3200, 5496), 35);
assert.equal(calc.workMinutesForRate(3200, 7000), 27);

const history = [
  { effectiveMonth: '2026-03', monthlyTakeHomeCents: 900000 },
  { effectiveMonth: '2026-08', monthlyTakeHomeCents: 1000000 },
];
assert.equal(calc.salaryForMonth(history, '2026-02', '2026-09'), 0);
assert.equal(calc.salaryForMonth(history, '2026-04', '2026-09'), 900000);
assert.equal(calc.salaryForMonth(history, '2026-09', '2026-09'), 1000000);
assert.equal(calc.salaryForMonth(history, '2026-10', '2026-09'), 0);

const legacy = calc.migrateSnapshot({
  settings: { monthlyTakeHomeCents: 1000000, payMonths: 12, workdaysPerMonth: 20,
    onsiteHoursPerDay: 8, commuteHoursPerDay: 1, overtimeHoursPerMonth: 0,
    workCostCentsPerMonth: 0, fundGoalCents: 0, fundCurrentCents: 0 },
  entries: [{ id: 7, kind: 'expense', amountCents: 3200, category: '吃饭',
    note: '', entryDate: '2026-09-03', expenseType: 'flexible' }],
}, '2026-09');
assert.equal(legacy.migrated, true);
assert.equal(legacy.snapshot.salaryHistory[0].effectiveMonth, '2026-09');
assert.equal(legacy.snapshot.entries.length, 1);

const undo = semantics.rememberUndo({ id: 7 }, 1000, 5000);
assert.deepEqual(semantics.takeUndo(undo, 5999), { id: 7 });
assert.equal(semantics.takeUndo(undo, 6000), null);

console.log('p0 behavior tests passed');
```

- [ ] **Step 2: Run the new test and verify the failure is meaningful**

Run: `node tools/p0-behavior-test.cjs`

Expected: FAIL because the new semantic functions and v2 snapshot behavior do not exist yet. Do not alter the test to make the current implementation pass.

- [ ] **Step 3: Implement the minimum pure functions**

Use UTC round-trip validation for dates:

```javascript
function isValidIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}
```

`salaryForMonth` must return `0` when `month > asOfMonth`; otherwise select the latest valid `effectiveMonth <= month`. `workMinutesForRate` must calculate directly from cents so rendering does not re-round the current hourly result. `migrateSnapshot` must normalize a versionless snapshot to v2 without discarding entries.

- [ ] **Step 4: Make the pure behavior tests pass**

Run: `node tools/p0-behavior-test.cjs`

Expected: PASS with `p0 behavior tests passed`.

- [ ] **Step 5: Update the existing smoke fixture and run all Node tests**

Add `salaryHistory` to the existing valid snapshot in `tools/smoke-test.cjs`, then run:

```powershell
Get-ChildItem -LiteralPath 'tools' -Filter '*.cjs' | Sort-Object Name | ForEach-Object { & node $_.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
```

Expected: the existing seven tests plus `p0-behavior-test.cjs` pass.

- [ ] **Step 6: Commit only cleanly isolated Task 1 files**

Stage the new semantic module, calculator, smoke fixture and new behavior test explicitly. Do not stage the already-dirty UI files in this commit.

---

### Task 2: Upgrade the Android data model and make v2 snapshots transactional

**Files:**
- Modify: `app/src/main/java/com/workerledger/app/LedgerModels.java`
- Modify: `app/src/main/java/com/workerledger/app/LedgerDbHelper.java`
- Modify: `app/src/main/java/com/workerledger/app/LedgerRepository.java`

**Interfaces:**
- `LedgerModels.Entry.hourlyRateCentsPerHour` is nullable; JSON key is `hourlyRateCentsPerHour`.
- `LedgerModels.Settings.salaryEffectiveMonth` is an optional input-only field.
- `LedgerRepository.loadSnapshot()` returns v2 JSON with `schemaVersion`, `settings`, `salaryHistory`, and `entries`.
- `LedgerRepository.exportSnapshot(String appVersion)` returns v2 JSON with `exportedAt` and `appVersion`.
- `LedgerRepository.previewImport(String json)` returns a JSON preview with version, export time, entry count, date range and salary-history count.
- `LedgerRepository.replaceFromSnapshot(String json)` normalizes legacy input, validates every field, and replaces all data inside one transaction.
- `LedgerRepository.deleteEntry(long id)` returns the deleted `LedgerModels.Entry`.
- `LedgerRepository.restoreEntry(LedgerModels.Entry entry)` restores the original ID and timestamps only when that ID is free.

- [ ] **Step 1: Extend the Java models without changing existing callers**

Parse `hourlyRateCentsPerHour` as a nullable `Long`; serialize JSON null when unavailable. Parse `salaryEffectiveMonth` only when present and do not store it in `user_settings`. Keep the existing public bridge method names.

- [ ] **Step 2: Implement the v2 schema for fresh databases**

Set `DATABASE_VERSION = 2`. In `onCreate`, create `ledger_entries` with nullable `hourly_rate_cents_per_hour`, create `user_settings`, and create:

```sql
CREATE TABLE salary_history (
  effective_month TEXT PRIMARY KEY,
  monthly_take_home_cents INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)
```

Do not insert a nonzero salary on first install.

- [ ] **Step 3: Implement the v1-to-v2 migration**

In `onUpgrade` for `oldVersion < 2`:

1. Add `hourly_rate_cents_per_hour` to `ledger_entries`.
2. Create `salary_history` if it does not exist.
3. Read the v1 settings once, calculate the current positive hourly rate in integer cents-per-hour, and backfill existing entries that have no snapshot. Use null when the denominator or result is invalid.
4. Convert the old settings `updated_at` to the device-local `YYYY-MM`; insert or replace one salary history row with the old monthly salary.

Use the same SQLite transaction boundary for all migration operations. Do not drop or recreate either existing table.

- [ ] **Step 4: Add repository serialization and validation**

Implement v2 snapshot output and strict Java validation:

- Reject unknown schema versions greater than 2.
- Accept versionless legacy snapshots only through a normalizer that adds v2 metadata, an import-month salary row, and missing entry snapshot defaults.
- Validate real dates with non-lenient Gregorian parsing and a format round trip.
- Validate real `YYYY-MM` values for salary history and `salaryEffectiveMonth`.
- Validate positive safe integer cents, finite nonnegative settings, allowed kinds, allowed expense types, nonempty categories, unique imported IDs, and timestamps.

Do not update the database during parsing, normalizing, previewing or validation.

- [ ] **Step 5: Implement salary history writes and historical entry snapshots**

`saveSettings` must update `user_settings` in a transaction. If `salaryEffectiveMonth` is present, require it to be no later than the current local month and insert or replace the matching salary history row. `insertEntry` calculates and stores the current hourly snapshot. `updateEntry` first reads the stored row and preserves its original snapshot regardless of the incoming JSON.

- [ ] **Step 6: Implement delete/restore repository operations**

Read the complete entry before deletion and return it to the caller. Restore using the original `_id`, `created_at`, `updated_at`, and `hourly_rate_cents_per_hour`; reject nonpositive IDs, malformed records, or ID collisions.

- [ ] **Step 7: Implement import replacement as one transaction**

Normalize and validate before `beginTransaction`. Inside the transaction delete old entries, replace settings, replace salary history, insert imported entries with explicit IDs, and call `setTransactionSuccessful()` only after every insert succeeds. Any exception must reach `endTransaction()` without success so the old database remains unchanged.

- [ ] **Step 8: Compile and run the pure regression suite**

Run:

```powershell
Get-ChildItem -LiteralPath 'tools' -Filter '*.cjs' | Sort-Object Name | ForEach-Object { & node $_.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
.\gradlew.bat :app:assembleDebug --offline
```

Expected: all Node tests pass and Gradle exits with code 0. Android database migration behavior remains pending a device or emulator.

- [ ] **Step 9: Commit only the Java data-layer files**

Stage `LedgerModels.java`, `LedgerDbHelper.java`, and `LedgerRepository.java` explicitly after reviewing the diff. Do not stage dirty UI assets.

---

### Task 3: Close the Android backup and Bridge security boundary

**Files:**
- Modify: `app/src/main/java/com/workerledger/app/LedgerBridge.java`
- Modify: `app/src/main/AndroidManifest.xml`
- Modify: `app/build.gradle`
- Modify: `.gitignore`
- Modify: `README.md`

**Interfaces:**
- `deleteEntry(String id)` returns a success envelope containing the deleted entry.
- `restoreEntry(String json)` returns a success/failure envelope.
- `requestExport()` exports `repository.exportSnapshot(BuildConfig.VERSION_NAME)`.
- `completeImport(Uri uri)` only creates a pending preview; it does not replace the database.
- `confirmImport()` applies the pending validated snapshot transactionally.
- `cancelImport()` discards the pending snapshot.

- [ ] **Step 1: Write the failing Bridge behavior fixture**

Extend `tools/p0-behavior-test.cjs` with the externally observable import rules: versionless input migrates, schema version 3 is rejected, and a malformed date returns `{ ok: false }` from the shared validator without mutating the original fixture object.

- [ ] **Step 2: Verify the fixture fails against the old contract**

Run: `node tools/p0-behavior-test.cjs`

Expected: FAIL because v2 normalization and rejection of higher schema versions are not implemented.

- [ ] **Step 3: Implement Bridge preview/confirm flow**

Add `pendingImportJson` to the Bridge. After reading the size-limited UTF-8 file, call `repository.previewImport`, store only the validated normalized content, and invoke:

```javascript
window.AppNative.onImportPreview(ok, message, previewJson)
```

`confirmImport` calls `replaceFromSnapshot` and only then sends the reloaded snapshot through `onImportResult`. Every failure clears or preserves the correct pending state and leaves the current database untouched.

- [ ] **Step 4: Implement deleted-entry envelopes and restore Bridge calls**

Return the deleted entry from `deleteEntry`; add `restoreEntry` as a narrow `@JavascriptInterface` method. Keep all errors in the existing `{ ok, error }` envelope and never return an empty string.

- [ ] **Step 5: Lock down the Manifest and release configuration**

Set `android:allowBackup="false"`; keep `usesCleartextTraffic="false"` and no permission declarations. Increment `versionCode` from 1 to 2. Add an optional local `keystore.properties` reader for the release signing config, but allow debug builds and unsigned release compilation when the local file is absent. Add `keystore.properties`, `*.jks`, `*.keystore`, and `*.p12` to `.gitignore`.

- [ ] **Step 6: Update the user-facing data boundary documentation**

Document v2 backup fields, legacy migration assumptions, no Android system backup, import preview/confirmation, and the fact that a user-created Release keystore is required for stable upgrades across machines.

- [ ] **Step 7: Run verification**

Run all Node tests and `.\gradlew.bat :app:assembleDebug --offline`. Check that the APK manifest contains no requested permissions and that the existing local-only WebView URL guard remains present. Do not claim release installation upgrade verification without a user-managed keystore and an Android target.

---

### Task 4: Connect the corrected semantics to the page without replacing existing visual work

**Files:**
- Modify: `app/src/main/assets/index.html`
- Modify: `app/src/main/assets/app.js`
- Create or modify: `app/src/main/assets/ledger-semantics.js`

**Interfaces:**
- `app.js` loads `ledger-semantics.js` before itself.
- `entryMarkup(entry, ...)` uses `entry.hourlyRateCentsPerHour`; it never recalculates historical entries from current settings.
- `onImportPreview(ok, message, previewJson)` asks for confirmation using the preview summary; confirmation calls `AndroidBridge.confirmImport()`.
- The undo state stores one deleted entry for 5000 ms and calls `AndroidBridge.restoreEntry(JSON.stringify(entry))`.

- [ ] **Step 1: Add income categories and the salary effective month input**

Add the income options `工资、奖金、兼职、礼金、报销、其他` to both entry forms through the shared category population function. Preserve an unknown historical category as a temporary option when editing. Add `<input id="hourly-effective-month" type="month">` to the hourly form without changing existing visual classes or unrelated copy.

- [ ] **Step 2: Wire category defaults and manual overrides**

Use `categoriesFor(kind)` when kind changes. On category change call `resolveExpenseType(category, currentType, false)`; on a manual expense-type change set the form override flag. When editing an existing entry, apply the saved expense type after populating the category so opening the editor cannot rewrite its value.

- [ ] **Step 3: Wire salary history into monthly calculations**

Initialize the effective month to the current local month. Include `salaryEffectiveMonth` only in the hourly settings save payload. `saveFund` must omit it. Pass the current month as `asOfMonth` to `monthlySummary` and `fundProjection`, so future month views show zero salary.

- [ ] **Step 4: Stop historical time values from changing**

Replace the current `calculateHourly(currentSettings)` call in `entryMarkup` with `workMinutesForRate(entry.amountCents, entry.hourlyRateCentsPerHour)`. If the snapshot is null or nonpositive, render no invented duration and keep the entry amount visible.

- [ ] **Step 5: Add delete undo and import confirmation**

After successful deletion, store the returned complete entry, show a five-second undo action in the existing toast mechanism, and clear it after timeout or after another entry is saved. On restore success reload the snapshot; on failure keep the record in the undo state and show an error. On import preview, display version/date/count/date-range information and call `confirmImport` only after user confirmation; cancellation calls `cancelImport`.

- [ ] **Step 6: Run behavior and build verification**

Run all Node tests and `.\gradlew.bat :app:assembleDebug --offline`. Review the diff for accidental changes to the existing UI, dark mode, illustrations and layout styles. Leave unrelated preexisting changes unstaged.

---

### Task 5: Final evidence and handoff

**Files:**
- No new production files.
- Review: all files modified by Tasks 1–4 and the committed design/plan documents.

- [ ] **Step 1: Run the complete Node suite from a clean command**

```powershell
Get-ChildItem -LiteralPath 'tools' -Filter '*.cjs' | Sort-Object Name | ForEach-Object { Write-Output ('RUN ' + $_.Name); & node $_.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
```

Record the exact number of passing tests and zero failures.

- [ ] **Step 2: Run the offline APK build**

```powershell
.\gradlew.bat :app:assembleDebug --offline
```

Record the exit code and APK path. Do not infer build success from source inspection.

- [ ] **Step 3: Inspect the final diff and status**

Run `git diff --check`, `git status --short`, and `git diff --stat`. Confirm no keystore, user UI-only change, or generated build output was staged.

- [ ] **Step 4: Report unresolved verification boundaries**

Explicitly report that database upgrade, transaction rollback, file picker preview/confirmation and undo interaction need an Android device or emulator. Do not describe these as tested until a target is connected.

- [ ] **Step 5: Handoff Release signing instructions**

Tell the user to create and back up a Release keystore outside the repository, configure local `keystore.properties`, install one Release build, then increment `versionCode` for every subsequent upgrade. Never ask the app to generate or expose the private key.
