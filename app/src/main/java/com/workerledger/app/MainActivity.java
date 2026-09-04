package com.workerledger.app;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebChromeClient;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    static final int REQUEST_EXPORT = 4101;
    static final int REQUEST_IMPORT = 4102;

    private WebView webView;
    private LedgerBridge bridge;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        webView.setBackgroundColor(getColor(R.color.cream_background));
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setAllowFileAccess(true);
        webView.getSettings().setAllowContentAccess(false);
        webView.getSettings().setAllowFileAccessFromFileURLs(false);
        webView.getSettings().setAllowUniversalAccessFromFileURLs(false);
        webView.setWebViewClient(new LocalAssetClient());
        webView.setWebChromeClient(new WebChromeClient());
        bridge = new LedgerBridge(this, webView, new LedgerRepository(this));
        webView.addJavascriptInterface(bridge, "AndroidBridge");
        setContentView(webView);
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (bridge == null) {
            return;
        }
        if (requestCode == REQUEST_EXPORT) {
            bridge.completeExport(resultCode == RESULT_OK && data != null ? data.getData() : null);
        } else if (requestCode == REQUEST_IMPORT) {
            bridge.completeImport(resultCode == RESULT_OK && data != null ? data.getData() : null);
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.removeJavascriptInterface("AndroidBridge");
            webView.destroy();
        }
        super.onDestroy();
    }

    private static final class LocalAssetClient extends WebViewClient {
        private boolean isLocalAsset(String url) {
            return url != null && url.startsWith("file:///android_asset/");
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return !isLocalAsset(url);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return !isLocalAsset(request.getUrl().toString());
        }
    }
}
