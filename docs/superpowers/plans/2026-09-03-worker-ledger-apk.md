# 打工人小账本 APK Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个不申请网络权限、使用 SQLite 本地保存数据、可直接安装到安卓手机的“打工人小账本” APK。

**Architecture:** 使用原生 Java Android Activity 承载 APK 内置的响应式 WebView 页面。原生层通过 SQLite 和 JavaScript Bridge 负责持久化、导入导出与失败反馈，页面层负责奶油薄荷手账 UI、计算、SVG 图表和触屏交互。

**Tech Stack:** Java、Android SDK API 34、Android Gradle Plugin 8.13.2、Gradle 8.13、SQLiteOpenHelper、WebView、原生 HTML/CSS/JavaScript、内联 SVG。

**Spec:** `docs/superpowers/specs/2026-09-03-worker-ledger-apk-design.md`

## Global Constraints

- 不登录、不联网、不接入远程数据库。
- 所有数据只存放在应用私有目录的 SQLite 数据库中。
- 不申请网络权限；换设备不会自动同步，只能通过 JSON 备份迁移。
- 首次安装显示空白账本，不写入演示流水，避免污染真实数据。
- 交付个人侧载可用的 `app-debug.apk`；正式商店签名不在本次范围内。
- Android 最低版本为 API 24（Android 7.0），compileSdk/targetSdk 使用 34。
- 不引入第三方 UI、图表或数据库依赖。
- 所有金额以整数分保存；所有数值输入在页面和原生层双重校验。
- 页面启动先显示布局和加载状态，再读取 SQLite；失败必须显示可重试的错误状态。

## File Map

- `settings.gradle`：Gradle 插件与模块设置。
- `build.gradle`：根项目 Android Gradle Plugin 版本。
- `gradle.properties`：Gradle/Android 构建参数。
- `gradlew`, `gradlew.bat`, `gradle/wrapper/*`：可复现的 Gradle 8.13 wrapper。
- `app/build.gradle`：Android application 配置、SDK 版本和资源目录。
- `app/src/main/AndroidManifest.xml`：Activity、主题和权限声明；明确不声明 `INTERNET`。
- `app/src/main/java/com/workerledger/app/MainActivity.java`：WebView 初始化、系统文件选择器、Bridge 生命周期。
- `app/src/main/java/com/workerledger/app/LedgerDbHelper.java`：SQLite 表创建、升级与事务基础设施。
- `app/src/main/java/com/workerledger/app/LedgerRepository.java`：设置和流水的 CRUD、快照序列化与导入替换。
- `app/src/main/java/com/workerledger/app/LedgerBridge.java`：只暴露给内置页面的 JavaScript Bridge。
- `app/src/main/res/values/strings.xml`：应用名称和可见文案资源。
- `app/src/main/res/values/themes.xml`：无 ActionBar 的应用主题。
- `app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`：最小自适应启动图标引用。
- `app/src/main/res/drawable/ic_launcher_foreground.xml`：简单薄荷色前景图标。
- `app/src/main/assets/index.html`：六个页面视图、导航和表单骨架。
- `app/src/main/assets/styles.css`：奶油薄荷视觉系统、响应式布局、触屏尺寸和状态样式。
- `app/src/main/assets/calculator.js`：可在浏览器和 Node 自检中复用的纯函数计算模块。
- `app/src/main/assets/app.js`：页面状态、Bridge 调用、渲染、表单事件和错误提示。
- `tools/smoke-test.cjs`：无第三方依赖的计算与快照校验自检。
- `README.md`：安装 APK、备份 JSON、导入迁移和数据丢失边界说明。

---

### Task 1: Bootstrap the Android project and prove an offline build

**Files:**
- Create: `settings.gradle`
- Create: `build.gradle`
- Create: `gradle.properties`
- Create: `app/build.gradle`
- Create: `app/src/main/AndroidManifest.xml`
- Create: `app/src/main/res/values/strings.xml`
- Create: `app/src/main/res/values/themes.xml`
- Create: `app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`
- Create: `app/src/main/res/drawable/ic_launcher_foreground.xml`
- Create: `gradlew`, `gradlew.bat`, `gradle/wrapper/gradle-wrapper.properties`, `gradle/wrapper/gradle-wrapper.jar`

**Interfaces:**
- Produces application id `com.workerledger.app`, main activity `com.workerledger.app.MainActivity`, and `app/src/main/assets/` as the WebView asset root for later tasks.

- [ ] **Step 1: Create the minimal Gradle files**

  Configure `pluginManagement` and `dependencyResolutionManagement` with `google()` and `mavenCentral()`, apply `com.android.application` version `8.13.2`, set `compileSdk 34`, `minSdk 24`, `targetSdk 34`, and use Java 8 source compatibility so the project remains compatible with Android API 24.

- [ ] **Step 2: Create the manifest and no-network theme**

  Declare only the exported `MainActivity`; do not add `<uses-permission android:name="android.permission.INTERNET" />`. Set a no-ActionBar theme and application label `打工人小账本`.

- [ ] **Step 3: Generate the Gradle 8.13 wrapper from the cached distribution**

  Run `C:\Users\34759\.gradle\wrapper\dists\gradle-8.13-bin\5xuhj0ry160q40clulazy9h7d\gradle-8.13\bin\gradle.bat wrapper --gradle-version 8.13` and keep the generated wrapper files in the repository.

- [ ] **Step 4: Run the first build check**

  Run `.\gradlew.bat :app:assembleDebug --offline`.

  Expected: `BUILD SUCCESSFUL` and `app/build/outputs/apk/debug/app-debug.apk` exists, even before the Activity implementation is added.

- [ ] **Step 5: Commit the buildable skeleton**

  ```powershell
  git add settings.gradle build.gradle gradle.properties app gradlew gradlew.bat gradle/wrapper
  git -c user.name=Codex -c user.email=codex@local commit -m "build: bootstrap offline Android app"
  ```

### Task 2: Implement SQLite storage and validated data models

**Files:**
- Create: `app/src/main/java/com/workerledger/app/LedgerDbHelper.java`
- Create: `app/src/main/java/com/workerledger/app/LedgerRepository.java`
- Create: `app/src/main/java/com/workerledger/app/LedgerModels.java`
- Create: `tools/smoke-test.cjs`

**Interfaces:**
- `LedgerRepository(Context context)` opens the private `worker-ledger.db` database.
- `String loadSnapshot()` returns `{"settings": {...}, "entries": [...]}`.
- `String saveSettings(String json)`, `String insertEntry(String json)`, `String updateEntry(String json)`, and `String deleteEntry(long id)` return an envelope `{"ok":true,"data":...}` or `{"ok":false,"error":"..."}`.
- `void replaceFromSnapshot(String json)` validates and replaces both tables inside one SQLite transaction.
- `LedgerModels.Settings` stores monthly salary, pay months, workdays, onsite hours, commute hours, overtime hours, monthly work costs, fund goal and fund current balance.
- `LedgerModels.Entry` stores kind, amount in cents, category, note, date, expense type, and timestamps.

- [ ] **Step 1: Write the failing pure validation and calculation self-check**

  Create `tools/smoke-test.cjs` with Node's built-in `assert` and these required checks:

  ```javascript
  const assert = require('node:assert/strict');
  const { calculateHourly, workMinutesForAmount, validateSnapshot } = require('../app/src/main/assets/calculator.js');

  assert.equal(calculateHourly({ salaryCents: 1000000, payMonths: 12, workdays: 20, onsiteHours: 8, commuteHours: 1, overtimeHours: 0, workCostCents: 0 }), 192.31);
  assert.equal(workMinutesForAmount(3200, 54.96), 35);
  assert.equal(validateSnapshot({ settings: {}, entries: [] }).ok, false);
  console.log('smoke test passed');
  ```

  Run `node tools/smoke-test.cjs`.

  Expected: FAIL because `calculator.js` and the storage validator do not exist yet.

- [ ] **Step 2: Create the SQLite schema**

  In `LedgerDbHelper`, create `ledger_entries` with `amount_cents INTEGER NOT NULL`, `kind TEXT NOT NULL`, `category TEXT NOT NULL`, `entry_date TEXT NOT NULL`, nullable `expense_type`, and millisecond timestamps. Create `user_settings` as a single row with `id = 1`. Insert one settings row with zero salary and the documented default time values on first database creation.

- [ ] **Step 3: Implement repository CRUD and transaction boundaries**

  Use `SQLiteDatabase.insertOrThrow`, `update`, `delete`, and explicit `beginTransaction/setTransactionSuccessful/endTransaction`. Convert cents through `long`; reject negative amounts, blank categories, unknown kinds, invalid dates, and invalid settings. `replaceFromSnapshot` must delete existing rows and insert validated imported rows in the same transaction, so a failed import leaves the old database unchanged.

- [ ] **Step 4: Add calculator/validator functions and make the self-check pass**

  Implement the CommonJS/browser-compatible `calculator.js` module with `calculateHourly`, `workMinutesForAmount`, `validateSnapshot`, `monthlySummary`, `fundProjection`, and `scenarioResult`. Use the exact formula from the spec, round displayed hourly results to two decimals, and return `null` for a zero/invalid time denominator rather than `Infinity`.

- [ ] **Step 5: Run the pure self-check**

  Run `node tools/smoke-test.cjs`.

  Expected: PASS and output `smoke test passed`.

- [ ] **Step 6: Commit the storage layer**

  ```powershell
  git add app/src/main/java/com/workerledger/app/LedgerDbHelper.java app/src/main/java/com/workerledger/app/LedgerRepository.java app/src/main/java/com/workerledger/app/LedgerModels.java app/src/main/assets/calculator.js tools/smoke-test.cjs
  git -c user.name=Codex -c user.email=codex@local commit -m "feat: add local ledger database and calculations"
  ```

### Task 3: Add the Android Activity, JavaScript Bridge, and JSON backup I/O

**Files:**
- Create: `app/src/main/java/com/workerledger/app/MainActivity.java`
- Create: `app/src/main/java/com/workerledger/app/LedgerBridge.java`
- Modify: `app/src/main/AndroidManifest.xml`

**Interfaces:**
- JavaScript calls `window.AndroidBridge.loadSnapshot()` and receives a JSON envelope synchronously.
- JavaScript calls `saveSettings(json)`, `insertEntry(json)`, `updateEntry(json)`, and `deleteEntry(id)` and receives the same envelope.
- JavaScript calls `requestExport()` and `requestImport()`; the Activity later invokes `window.AppNative.onExportResult(ok, message)` or `window.AppNative.onImportResult(ok, message, json)`.
- The Bridge is added only after `file:///android_asset/index.html` is loaded and no external URL is accepted.

- [ ] **Step 1: Configure the WebView for local assets only**

  In `MainActivity`, enable JavaScript and DOM storage, disable network access where supported, set a WebViewClient that rejects non-`file:///android_asset/` navigation, load `file:///android_asset/index.html`, and attach a single `LedgerBridge` instance.

- [ ] **Step 2: Implement synchronous local CRUD Bridge calls**

  Annotate only the six storage methods with `@JavascriptInterface`; each method catches repository exceptions and returns a structured failure envelope. Never return an empty string for failure. Keep the database private to the app.

- [ ] **Step 3: Implement export through `ACTION_CREATE_DOCUMENT`**

  `requestExport()` obtains the repository snapshot, stores it only in an Activity field until the picker returns, and launches `application/json` with a suggested filename such as `打工人小账本-2026-09-03.json`. On write failure, call the page callback with the failure text.

- [ ] **Step 4: Implement import through `ACTION_OPEN_DOCUMENT`**

  `requestImport()` launches a single-select `application/json` picker. Read UTF-8 content through `ContentResolver`, reject files over 2 MB, call `replaceFromSnapshot`, and send the reloaded snapshot only after the transaction succeeds. On any parse or validation failure, keep the current database untouched.

- [ ] **Step 5: Compile the native layer**

  Run `.\gradlew.bat :app:compileDebugJavaWithJavac --offline`.

  Expected: `BUILD SUCCESSFUL` with no Java compile errors.

- [ ] **Step 6: Commit the Android data boundary**

  ```powershell
  git add app/src/main/java/com/workerledger/app/MainActivity.java app/src/main/java/com/workerledger/app/LedgerBridge.java app/src/main/AndroidManifest.xml
  git -c user.name=Codex -c user.email=codex@local commit -m "feat: bridge Android storage and backups"
  ```

### Task 4: Build the responsive shell and visual design system

**Files:**
- Create: `app/src/main/assets/index.html`
- Create: `app/src/main/assets/styles.css`
- Create: `app/src/main/assets/app.js`

**Interfaces:**
- `index.html` exposes view containers with IDs `view-dashboard`, `view-hourly`, `view-ledger`, `view-monthly`, `view-fund`, and `view-discover`.
- Navigation buttons carry `data-view` values matching those IDs.
- `app.js` owns the single page state and calls `render(state)` after every state transition.

- [ ] **Step 1: Create the semantic HTML shell**

  Add an app header, desktop sidebar, mobile bottom navigation, six view containers, global toast region with `role="status"`, a reusable error card with retry button, and modal/form containers for editing a ledger entry. Every touch target must have a minimum 44px hit area.

- [ ] **Step 2: Add the visual system**

  Define CSS variables for cream, mint, ink, coral and border colors; add rounded cards, soft shadows, responsive grid rules, `@media (max-width: 760px)` bottom navigation, and `@media (min-width: 761px)` sidebar layout. Add a dark theme class without introducing a theme library.

- [ ] **Step 3: Add inline SVG icon primitives and piggy-bank illustration**

  Keep icons inside `index.html` or generated by a small local helper in `app.js`; use no image URL, external font or remote asset. Include the piggy-bank illustration with a coin and sprout in the dashboard hero.

- [ ] **Step 4: Verify the shell renders without data**

  Run `.\gradlew.bat :app:assembleDebug --offline` and install the APK on an available emulator/device if one is available. Open the app and verify the shell is visible before the data callback returns; with no database entries, the dashboard shows empty states instead of a blank screen.

- [ ] **Step 5: Commit the visual shell**

  ```powershell
  git add app/src/main/assets/index.html app/src/main/assets/styles.css app/src/main/assets/app.js
  git -c user.name=Codex -c user.email=codex@local commit -m "feat: add responsive mint ledger shell"
  ```

### Task 5: Implement page state, loading/error behavior, and dashboard/quick entry

**Files:**
- Modify: `app/src/main/assets/app.js`
- Modify: `app/src/main/assets/index.html`

**Interfaces:**
- State shape: `{ phase: 'loading'|'ready'|'error', snapshot, activeView, draft, error }`.
- `loadSnapshot()` renders `loading`, calls `AndroidBridge.loadSnapshot`, then renders `ready` or `error`.
- `write(operation, payload)` preserves the draft until the Bridge returns `{ok:true}`.

- [ ] **Step 1: Add first-render-then-load flow**

  Initialize with zero-value settings and empty entries, render the shell immediately, then call `loadSnapshot()` on `DOMContentLoaded`. If the bridge is unavailable, show “本地数据接口不可用” with a retry button.

- [ ] **Step 2: Render the dashboard KPIs**

  Use the calculator module to show real hourly wage, current-month expense, fund progress, and the latest four records. Display empty-state copy when no entries exist. Format amounts in yuan and work time as hours/minutes.

- [ ] **Step 3: Implement the 10-second entry form**

  Add income/expense toggle, amount, category, note, date, expense type, and save button. Hide fixed/flexible controls for income. Default expense type from category (`房租` fixed, all other default categories flexible) but preserve manual override.

- [ ] **Step 4: Implement success and failure behavior**

  Disable the submit button while writing, retain values on failure, display the returned error and a retry button, and only clear the form after a successful insert. After a successful expense, show the amount-to-work-time conversion in a toast and refresh the dashboard.

- [ ] **Step 5: Add recent-entry edit/delete actions**

  Add accessible edit and delete controls on each recent record. Editing reuses the form; deleting requires a confirmation dialog, calls `deleteEntry`, and refreshes only after success.

- [ ] **Step 6: Commit the dashboard flow**

  ```powershell
  git add app/src/main/assets/index.html app/src/main/assets/app.js
  git -c user.name=Codex -c user.email=codex@local commit -m "feat: add dashboard and quick ledger entry"
  ```

### Task 6: Implement hourly wage, monthly summary, and fund views

**Files:**
- Modify: `app/src/main/assets/index.html`
- Modify: `app/src/main/assets/app.js`
- Modify: `app/src/main/assets/styles.css`

**Interfaces:**
- Settings form serializes to `user_settings` JSON keys defined in `LedgerModels.Settings`.
- `renderHourly(settings)` shows the formula inputs and calculated result.
- `renderMonthly(snapshot, month)` displays salary income, extra income, total income, fixed expense, flexible expense, and balance.
- `renderFund(snapshot, month)` displays fund goal/current balance, safety months, and SVG projection.

- [ ] **Step 1: Build the hourly wage form and formula expansion**

  Add numeric inputs for salary, pay months, workdays, onsite hours, commute hours, overtime hours and monthly work costs. Show the exact formula with substituted values, the real hourly wage, nominal hourly wage and percentage difference. Save through `AndroidBridge.saveSettings` and refresh all dependent views.

- [ ] **Step 2: Build the monthly summary**

  Add a native month input, derive salary income from settings for the selected month, sum extra income from `income` entries, and split expenses by `fixed`/`flexible`. Include all required totals and a category distribution without adding a chart dependency.

- [ ] **Step 3: Build the fund view and inline SVG curve**

  Add goal/current balance settings and save them through the same settings operation. Display progress and remaining amount. Use `fundProjection` to create six monthly points and draw a `<polyline>` plus axes/labels directly in SVG. Show “暂无支出样本” when safety months cannot be computed.

- [ ] **Step 4: Verify calculations against the pure self-check**

  Run `node tools/smoke-test.cjs` and manually enter the same values in the APK. Confirm the displayed wage and work-time conversion match the self-check values within the documented rounding.

- [ ] **Step 5: Commit the analysis views**

  ```powershell
  git add app/src/main/assets/index.html app/src/main/assets/app.js app/src/main/assets/styles.css
  git -c user.name=Codex -c user.email=codex@local commit -m "feat: add wage summary and freedom fund views"
  ```

### Task 7: Implement scenario simulations, backups UI, and interaction polish

**Files:**
- Modify: `app/src/main/assets/index.html`
- Modify: `app/src/main/assets/app.js`
- Modify: `app/src/main/assets/styles.css`

**Interfaces:**
- `scenarioResult(settings, { commuteHours, overtimeHours, raisePercent })` returns baseline and scenario values for hourly wage, annual time cost and monthly balance.
- `AndroidBridge.requestExport()` and `AndroidBridge.requestImport()` are surfaced as visible backup buttons in the sidebar/header and fund/settings view.

- [ ] **Step 1: Add commute, overtime and raise simulation controls**

  Use touch-friendly range/number controls. Commute changes round-trip daily hours; overtime changes monthly overtime hours and is labeled “按无额外加班费估算”; raise changes monthly take-home salary. Show baseline and simulated absolute values plus the delta.

- [ ] **Step 2: Add backup and restore controls**

  Add “导出备份” and “导入备份” buttons. On import success replace the in-memory snapshot with the callback snapshot, rerender every view and show a success toast. On failure show the exact error and keep current data.

- [ ] **Step 3: Add navigation/theme/accessibility polish**

  Ensure every tab changes the active view, the theme toggle persists only for the current app session unless a setting is explicitly added, labels are associated with inputs, keyboard focus is visible, and error/toast messages are readable in both themes.

- [ ] **Step 4: Commit the scenario and backup flow**

  ```powershell
  git add app/src/main/assets/index.html app/src/main/assets/app.js app/src/main/assets/styles.css
  git -c user.name=Codex -c user.email=codex@local commit -m "feat: add scenarios and offline backup controls"
  ```

### Task 8: Build, install, and verify the APK end to end

**Files:**
- Create: `README.md`
- Verify: `app/build/outputs/apk/debug/app-debug.apk`

**Interfaces:**
- The final APK installs as `com.workerledger.app`, launches `MainActivity`, and does not declare network access.

- [ ] **Step 1: Run all pure checks**

  Run `node tools/smoke-test.cjs`.

  Expected: `smoke test passed`.

- [ ] **Step 2: Build the final debug APK offline**

  Run `.\gradlew.bat clean :app:assembleDebug --offline`.

  Expected: `BUILD SUCCESSFUL`; verify `app/build/outputs/apk/debug/app-debug.apk` exists.

- [ ] **Step 3: Verify permissions and APK contents**

  Run `C:\Users\34759\AppData\Local\Android\Sdk\build-tools\35.0.0\aapt.exe dump permissions app/build/outputs/apk/debug/app-debug.apk`.

  Expected: no `android.permission.INTERNET` line. Also inspect the APK with `apkanalyzer` if available and confirm `index.html`, `styles.css`, `calculator.js` and `app.js` are packaged.

- [ ] **Step 4: Install and run on an available Android target**

  Use `C:\Users\34759\AppData\Local\Android\Sdk\platform-tools\adb.exe devices`; when a target is listed, run `adb install -r app/build/outputs/apk/debug/app-debug.apk` and launch `adb shell monkey -p com.workerledger.app 1`.

- [ ] **Step 5: Execute the end-to-end acceptance checklist**

  1. App opens to a visible blank dashboard before data load completes.
  2. Set salary parameters; close/reopen the app; values remain.
  3. Add an expense; the new record appears in recent four and shows work-time conversion.
  4. Add extra income; monthly summary separates salary and extra income.
  5. Edit and delete a record; canceling delete leaves it intact.
  6. Change fixed/flexible override; monthly totals move to the matching bucket.
  7. Set fund target/current amount; SVG curve and safety months render.
  8. Run all three scenario controls; baseline remains visible and values change.
  9. Export JSON; clear app data only after confirming the backup exists; import JSON; records/settings return.
  10. Temporarily make a Bridge call fail in a debug build or disconnect the file operation; the UI shows a retryable error and does not clear the draft.

- [ ] **Step 6: Write the installation and backup guide**

  `README.md` must explain where the APK is, how to install it on Android, how to export/import the JSON backup, and that uninstalling or clearing app data deletes the local database.

- [ ] **Step 7: Commit the verified delivery**

  ```powershell
  git add README.md
  git -c user.name=Codex -c user.email=codex@local commit -m "docs: add APK installation and backup guide"
  ```

## Plan Self-Review

- Spec coverage: local SQLite tables (Task 2), no network permission (Tasks 1/3/8), first render then load and retryable errors (Task 5), income/expense and fixed/flexible entries (Task 5), wage formula (Task 6), recent four and monthly summary (Tasks 5/6), fund and native SVG curve (Task 6), scenarios (Task 7), Android touch/responsive layout (Task 4), JSON backup (Tasks 3/7/8), APK build and permission verification (Task 8).
- Placeholder scan: every implementation step has concrete files, commands, expected results or exact behavior; no unfinished marker or unspecified implementation step appears in the plan.
- Type consistency: the `LedgerModels.Settings`/`Entry` JSON fields are consumed by repository, Bridge and page state; `calculator.js` exports the same functions used by `tools/smoke-test.cjs` and `app.js`.
- Simplification boundary: no remote sync, user accounts, dependency-heavy UI framework, chart library or store-release signing is included because the approved scope is one-person offline APK use.
