package com.workerledger.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public final class LedgerBridge {
    private static final int MAX_IMPORT_BYTES = 2 * 1024 * 1024;
    private final Activity activity;
    private final WebView webView;
    private final LedgerRepository repository;
    private String pendingExportJson;
    private String pendingImportJson;

    LedgerBridge(Activity activity, WebView webView, LedgerRepository repository) {
        this.activity = activity;
        this.webView = webView;
        this.repository = repository;
    }

    @JavascriptInterface
    public String loadSnapshot() {
        try {
            return success(new JSONObject(repository.loadSnapshot()));
        } catch (Exception error) {
            return failure(error);
        }
    }

    @JavascriptInterface
    public String saveSettings(String json) {
        try {
            repository.saveSettings(LedgerModels.Settings.fromJson(new JSONObject(json)));
            return success(JSONObject.NULL);
        } catch (Exception error) {
            return failure(error);
        }
    }

    @JavascriptInterface
    public String insertEntry(String json) {
        try {
            long id = repository.insertEntry(LedgerModels.Entry.fromJson(new JSONObject(json)));
            JSONObject data = new JSONObject();
            data.put("id", id);
            return success(data);
        } catch (Exception error) {
            return failure(error);
        }
    }

    @JavascriptInterface
    public String updateEntry(String json) {
        try {
            repository.updateEntry(LedgerModels.Entry.fromJson(new JSONObject(json)));
            return success(JSONObject.NULL);
        } catch (Exception error) {
            return failure(error);
        }
    }

    @JavascriptInterface
    public String deleteEntry(String idText) {
        try {
            return success(repository.deleteEntry(Long.parseLong(idText)).toJson());
        } catch (Exception error) {
            return failure(error);
        }
    }

    @JavascriptInterface
    public String restoreEntry(String json) {
        try {
            LedgerModels.Entry entry = LedgerModels.Entry.fromJson(new JSONObject(json));
            repository.restoreEntry(entry);
            return success(entry.toJson());
        } catch (Exception error) {
            return failure(error);
        }
    }

    @JavascriptInterface
    public void requestExport() {
        try {
            pendingExportJson = repository.exportSnapshot(BuildConfig.VERSION_NAME);
            activity.runOnUiThread(() -> {
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                intent.putExtra(Intent.EXTRA_TITLE, "打工人小账本-"
                        + new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date()) + ".json");
                activity.startActivityForResult(intent, MainActivity.REQUEST_EXPORT);
            });
        } catch (Exception error) {
            notifyExport(false, message(error));
        }
    }

    @JavascriptInterface
    public void requestImport() {
        pendingImportJson = null;
        activity.runOnUiThread(() -> {
            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType("application/json");
            activity.startActivityForResult(intent, MainActivity.REQUEST_IMPORT);
        });
    }

    void completeExport(Uri uri) {
        String json = pendingExportJson;
        pendingExportJson = null;
        if (uri == null || json == null) {
            notifyExport(false, "已取消导出");
            return;
        }
        try (OutputStream output = activity.getContentResolver().openOutputStream(uri)) {
            if (output == null) {
                throw new IllegalStateException("无法打开备份文件");
            }
            output.write(json.getBytes(StandardCharsets.UTF_8));
            output.flush();
            notifyExport(true, "备份已导出");
        } catch (Exception error) {
            notifyExport(false, message(error));
        }
    }

    void completeImport(Uri uri) {
        if (uri == null) {
            notifyImportPreview(false, "已取消导入", null);
            return;
        }
        try (InputStream input = activity.getContentResolver().openInputStream(uri)) {
            if (input == null) {
                throw new IllegalStateException("无法打开备份文件");
            }
            JSONObject preview = new JSONObject(repository.previewImport(readLimited(input)));
            pendingImportJson = preview.getJSONObject("snapshot").toString();
            preview.remove("snapshot");
            notifyImportPreview(true, "备份已准备，请确认后导入", preview.toString());
        } catch (Exception error) {
            pendingImportJson = null;
            notifyImportPreview(false, message(error), null);
        }
    }

    @JavascriptInterface
    public void confirmImport() {
        String json = pendingImportJson;
        if (json == null) {
            notifyImport(false, "没有待确认的备份", null);
            return;
        }
        try {
            repository.replaceFromSnapshot(json);
            pendingImportJson = null;
            notifyImport(true, "备份已导入", repository.loadSnapshot());
        } catch (Exception error) {
            notifyImport(false, message(error), null);
        }
    }

    @JavascriptInterface
    public String cancelImport() {
        pendingImportJson = null;
        try {
            return success(JSONObject.NULL);
        } catch (Exception error) {
            return failure(error);
        }
    }

    private String readLimited(InputStream input) throws Exception {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int total = 0;
        int count;
        while ((count = input.read(buffer)) != -1) {
            total += count;
            if (total > MAX_IMPORT_BYTES) {
                throw new IllegalArgumentException("备份文件超过 2 MB 限制");
            }
            output.write(buffer, 0, count);
        }
        return output.toString(StandardCharsets.UTF_8.name());
    }

    private String success(Object data) throws JSONException {
        JSONObject result = new JSONObject();
        result.put("ok", true);
        result.put("data", data == null ? JSONObject.NULL : data);
        return result.toString();
    }

    private String failure(Exception error) {
        JSONObject result = new JSONObject();
        try {
            result.put("ok", false);
            result.put("error", message(error));
        } catch (JSONException ignored) {
            return "{\"ok\":false,\"error\":\"本地数据操作失败\"}";
        }
        return result.toString();
    }

    private String message(Exception error) {
        String text = error.getMessage();
        return text == null || text.trim().isEmpty() ? "本地数据操作失败" : text;
    }

    private void notifyExport(boolean ok, String message) {
        callPage("window.AppNative && window.AppNative.onExportResult(" + ok + ","
                + JSONObject.quote(message) + ");");
    }

    private void notifyImport(boolean ok, String message, String snapshot) {
        String snapshotArgument = snapshot == null ? "null" : JSONObject.quote(snapshot);
        callPage("window.AppNative && window.AppNative.onImportResult(" + ok + ","
                + JSONObject.quote(message) + "," + snapshotArgument + ");");
    }

    private void notifyImportPreview(boolean ok, String message, String preview) {
        String previewArgument = preview == null ? "null" : JSONObject.quote(preview);
        callPage("window.AppNative && window.AppNative.onImportPreview(" + ok + ","
                + JSONObject.quote(message) + "," + previewArgument + ");");
    }

    private void callPage(String script) {
        webView.post(() -> webView.evaluateJavascript(script, null));
    }
}
