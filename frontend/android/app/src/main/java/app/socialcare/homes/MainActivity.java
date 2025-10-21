package app.socialcare.homes;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Configure WebView for better touch handling
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            
            // Enable JavaScript (should already be enabled by Capacitor)
            settings.setJavaScriptEnabled(true);
            
            // Enable DOM storage
            settings.setDomStorageEnabled(true);
            
            // Enable database
            settings.setDatabaseEnabled(true);
            
            // Enable mixed content (for development)
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            
            // Improve touch responsiveness
            settings.setBuiltInZoomControls(false);
            settings.setSupportZoom(false);
            settings.setDisplayZoomControls(false);
            
            // Enable hardware acceleration
            webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
            
            // Disable long click (prevents accidental text selection)
            webView.setOnLongClickListener(v -> true);
            
            // Enable faster scrolling
            webView.setScrollBarStyle(WebView.SCROLLBARS_OUTSIDE_OVERLAY);
        }
    }
}

