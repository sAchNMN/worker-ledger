# Task 3 report — Bridge backup boundary

## Status

DONE_WITH_CONCERNS

## Commit

`5e5a25a feat: harden backup bridge workflow`

## Delivered

- `LedgerBridge` now holds only the Repository-validated, normalized pending snapshot. File selection produces `window.AppNative.onImportPreview(ok, message, previewJson)` and does not mutate SQLite. `confirmImport()` replaces from that pending snapshot and reloads only after replacement; `cancelImport()` discards it.
- The Repository preview result now carries the canonical normalized snapshot alongside its preview metadata, so Bridge does not duplicate legacy migration.
- `deleteEntry` returns the deleted entry in the normal `{ ok, data }` envelope. `restoreEntry` accepts one entry JSON and returns the same envelope on success or `{ ok: false, error }` on error.
- Exports now use `repository.exportSnapshot(BuildConfig.VERSION_NAME)`.
- Android system backup is disabled, versionCode is 2, optional local release-signing properties are supported without creating, reading, printing, or committing key material, and key-related files are ignored.
- README documents v2 fields, legacy migration, system-backup policy, preview/confirmation, and stable-release signing requirements.

## TDD evidence

1. Added the schema-v3 migration regression assertion to `tools/p0-behavior-test.cjs`.
2. RED command: `node tools/p0-behavior-test.cjs`

```text
AssertionError [ERR_ASSERTION]: Missing expected exception.
...
expected: /不支持的备份版本/
```

3. Added the minimal `calculator.js` rejection for explicitly versioned non-v2 snapshots. The fixture also asserts malformed-date validation returns `{ ok: false }` without mutating its input object.
4. GREEN command: `node tools/p0-behavior-test.cjs; node tools/bridge-contract-test.cjs`

```text
p0 behavior tests passed
bridge contract passed
```

The existing Node harness cannot instantiate the Android SQLite Repository; consequently, canonical-preview behavior is validated by the offline Android compilation and code-level self-review rather than a misleading source-text assertion. The canonical data path is one Repository call: `normalize` → `validateSnapshot` → preview result `snapshot` → Bridge pending state → `replaceFromSnapshot`.

## Verification

Focused Node tests:

```powershell
node tools/p0-behavior-test.cjs; node tools/bridge-contract-test.cjs
```

```text
p0 behavior tests passed
bridge contract passed
```

Full Node suite:

```powershell
Get-ChildItem tools -Filter '*test.cjs' | Sort-Object Name | ForEach-Object { Write-Host "`n> node $($_.FullName)"; node $_.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
```

```text
app flow contract passed
bridge contract passed
input constraint passed
p0 behavior tests passed
scenario view contract passed
schema contract passed
smoke test passed
ui contract passed
```

Offline build:

```powershell
.\gradlew.bat :app:assembleDebug --offline
```

```text
BUILD SUCCESSFUL in 1s
34 actionable tasks: 6 executed, 28 up-to-date
```

The first build exposed `BuildConfig.VERSION_NAME` as unavailable because this AGP configuration did not generate BuildConfig by default. Enabling `buildFeatures { buildConfig true }` was the single root-cause fix; the rerun above compiled successfully. Java 8/deprecation warnings remain pre-existing toolchain warnings.

Manifest and WebView boundary checks:

```powershell
$mergedManifest = Get-ChildItem 'app\build\intermediates\merged_manifest\debug' -Recurse -Filter AndroidManifest.xml | Select-Object -First 1 -ExpandProperty FullName; Select-String -LiteralPath $mergedManifest -Pattern '<uses-permission'; Select-String -LiteralPath 'app\src\main\java\com\workerledger\app\MainActivity.java' -Pattern 'return !isLocalAsset\(url\)|return !isLocalAsset\(request.getUrl\(\).toString\(\)\)'
```

```text
No requested permissions in merged debug manifest
MainActivity.java:64: return !isLocalAsset(url);
MainActivity.java:69: return !isLocalAsset(request.getUrl().toString());
```

## Files changed

- `.gitignore`
- `README.md`
- `app/build.gradle`
- `app/src/main/AndroidManifest.xml`
- `app/src/main/assets/calculator.js` (authorized narrow cross-task fix)
- `app/src/main/java/com/workerledger/app/LedgerBridge.java`
- `app/src/main/java/com/workerledger/app/LedgerRepository.java` (authorized narrow cross-task fix)
- `tools/p0-behavior-test.cjs`
- `.superpowers/sdd/2026-09-03-ledger-p0-correctness/task-3-report.md`

## Self-review

- No dirty UI files (`app.js`, `index.html`, `styles.css`, `tools/ui-contract-test.cjs`, or `assets/media`) were modified or staged by this task.
- Bridge does not parse, migrate, or validate raw import structures itself; it stores only the Repository preview's canonical `snapshot` field.
- Preview does not call `replaceFromSnapshot`; confirmation does. A failed confirmation preserves the validated pending snapshot for retry, while selection failure/cancellation leaves no new pending snapshot.
- The Manifest has `allowBackup="false"`, preserves `usesCleartextTraffic="false"`, and has no permission declarations. The generated merged debug manifest has no requested permissions.
- No keystore or private-key material was generated, read, printed, staged, or committed.
- `git diff --check` reported no whitespace errors.

## Concerns

- Release-install upgrade behavior cannot be verified without a user-managed signing keystore and an Android target device/emulator. This task intentionally does not claim that verification.
- `aapt` is not installed in this environment, so requested-permission verification used the generated merged debug manifest (the input used to package the APK), not a decoded APK manifest.
