package com.flappybird3d.tv;

import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
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

        // Keep TV screen awake while playing
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Enable immersive full-screen mode for TV
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

        // Load the 3D Flappy Bird TV edition from local assets
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
            if (mWebView != null) {
                mWebView.requestFocus();
            }
        }
    }

    // --- Android TV D-Pad & Remote Control Key Interception ---
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (mWebView == null) return super.onKeyDown(keyCode, event);

        switch (keyCode) {
            case KeyEvent.KEYCODE_DPAD_CENTER:
            case KeyEvent.KEYCODE_ENTER:
            case KeyEvent.KEYCODE_BUTTON_A:
            case KeyEvent.KEYCODE_BUTTON_START:
            case KeyEvent.KEYCODE_SPACE:
                mWebView.evaluateJavascript("if (window.tvRemote) window.tvRemote.handleSelect();", null);
                return true;

            case KeyEvent.KEYCODE_DPAD_UP:
                mWebView.evaluateJavascript("if (window.tvRemote) window.tvRemote.handleUp();", null);
                return true;

            case KeyEvent.KEYCODE_DPAD_DOWN:
                mWebView.evaluateJavascript("if (window.tvRemote) window.tvRemote.handleDown();", null);
                return true;

            case KeyEvent.KEYCODE_DPAD_LEFT:
                mWebView.evaluateJavascript("if (window.tvRemote) window.tvRemote.handleLeft();", null);
                return true;

            case KeyEvent.KEYCODE_DPAD_RIGHT:
                mWebView.evaluateJavascript("if (window.tvRemote) window.tvRemote.handleRight();", null);
                return true;

            case KeyEvent.KEYCODE_MENU:
            case KeyEvent.KEYCODE_SETTINGS:
                mWebView.evaluateJavascript("if (window.tvRemote) window.tvRemote.toggleSettings();", null);
                return true;

            case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
            case KeyEvent.KEYCODE_MEDIA_PLAY:
            case KeyEvent.KEYCODE_MEDIA_PAUSE:
                mWebView.evaluateJavascript("if (window.flappyGame) window.flappyGame.togglePause();", null);
                return true;

            case KeyEvent.KEYCODE_BACK:
                mWebView.evaluateJavascript(
                    "(function() { " +
                    "  if (window.tvRemote && window.tvRemote.handleBack()) return true; " +
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
                return true;
        }

        return super.onKeyDown(keyCode, event);
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
            mWebView.requestFocus();
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
