package com.flappybird3d.game;

import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {

    private WebView mWebView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep screen active while playing
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // IGNORE NOTCH & CUTOUT: Fill full screen into camera notch/cutout
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(lp);
        }

        // Enable immersive full-screen mode
        setImmersiveMode();

        // Create and configure WebView
        mWebView = new WebView(this);
        mWebView.setBackgroundColor(0xFF000000);
        mWebView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        mWebView.setClickable(true);
        mWebView.setFocusable(true);
        mWebView.setFocusableInTouchMode(true);
        mWebView.requestFocus();

        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });

        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage cm) {
                return true;
            }
        });

        setContentView(mWebView);

        // Load the 3D Flappy Bird game from local assets
        mWebView.loadUrl("file:///android_asset/index.html");
    }

    private void setImmersiveMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            Window window = getWindow();
            window.getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            );
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            setImmersiveMode();
        }
    }

    @Override
    public void onBackPressed() {
        if (mWebView != null) {
            mWebView.evaluateJavascript(
                "(function() { " +
                "  if (window.flappyGame && window.flappyGame.state === 'PLAYING') { " +
                "    window.flappyGame.togglePause(); return true; " +
                "  } return false; " +
                "})()",
                new ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String value) {
                        if (!"true".equals(value)) {
                            MainActivity.super.onBackPressed();
                        }
                    }
                }
            );
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (mWebView != null) {
            mWebView.evaluateJavascript("if (window.flappyGame && window.flappyGame.state === 'PLAYING') window.flappyGame.togglePause();", null);
            mWebView.onPause();
            mWebView.pauseTimers();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        setImmersiveMode();
        if (mWebView != null) {
            mWebView.onResume();
            mWebView.resumeTimers();
        }
    }

    @Override
    protected void onDestroy() {
        if (mWebView != null) {
            mWebView.destroy();
            mWebView = null;
        }
        super.onDestroy();
    }
}
