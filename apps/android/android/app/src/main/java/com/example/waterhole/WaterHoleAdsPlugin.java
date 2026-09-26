package com.example.waterhole;

import android.os.SystemClock;
import androidx.annotation.NonNull;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;

@CapacitorPlugin(name = "WaterHoleAds")
public class WaterHoleAdsPlugin extends Plugin {
    // Deliberately no production ID lookup: configuration alone cannot enable live ads.
    private static final String TEST_UNIT = "ca-app-pub-3940256099942544/1033173712";
    private final AdBreakPolicy policy = new AdBreakPolicy(SystemClock.elapsedRealtime());
    private ConsentInformation consent;
    private InterstitialAd cached;
    private boolean initializing, initialized, loading, showing, foreground = true;
    private long loadedAt;
    private boolean enabled() { return BuildConfig.DEBUG && BuildConfig.TEST_ADS; }
    private JSObject status() {
        JSObject result = new JSObject();
        result.put("privacyRequired", consent != null && consent.getPrivacyOptionsRequirementStatus() == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED);
        result.put("ready", cached != null);
        return result;
    }
    @PluginMethod public void prepare(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (!enabled()) { call.resolve(status()); return; }
            consent = UserMessagingPlatform.getConsentInformation(getContext());
            consent.requestConsentInfoUpdate(getActivity(), new ConsentRequestParameters.Builder().build(), () -> {
                if (!foreground) { call.resolve(status()); return; }
                UserMessagingPlatform.loadAndShowConsentFormIfRequired(getActivity(), error -> {
                    if (error == null && consent.canRequestAds()) initialize();
                    call.resolve(status());
                });
            }, error -> { cached = null; call.resolve(status()); });
        });
    }
    private void initialize() {
        if (!enabled() || consent == null || !consent.canRequestAds()) return;
        if (initialized) { preload(); return; }
        if (initializing) return;
        initializing = true;
        new Thread(() -> MobileAds.initialize(getContext(), initialization -> getActivity().runOnUiThread(() -> {
            initializing = false; initialized = true; preload();
        })), "water-hole-ads-init").start();
    }
    private void preload() {
        if (!enabled() || !initialized || consent == null || !consent.canRequestAds() || policy.playing() || !foreground || cached != null || loading || showing) return;
        loading = true;
        InterstitialAd.load(getContext(), TEST_UNIT, new AdRequest.Builder().build(), new InterstitialAdLoadCallback() {
            @Override public void onAdLoaded(@NonNull InterstitialAd ad) {
                loading = false;
                if (consent.canRequestAds()) { cached = ad; loadedAt = SystemClock.elapsedRealtime(); }
            }
            @Override public void onAdFailedToLoad(@NonNull LoadAdError error) { loading = false; cached = null; }
        });
    }
    @PluginMethod public void beginRound(PluginCall call) { getActivity().runOnUiThread(() -> {
        if (showing || !foreground) { call.reject("Round cannot begin while the app is covered"); return; }
        policy.begin(); call.resolve();
    }); }
    @PluginMethod public void completedRound(PluginCall call) { getActivity().runOnUiThread(() -> { policy.complete(); preload(); call.resolve(); }); }
    @PluginMethod public void replayBreak(PluginCall call) { getActivity().runOnUiThread(() -> {
        long now = SystemClock.elapsedRealtime();
        if (now - loadedAt >= 3_600_000L) cached = null;
        if (!enabled() || !foreground || showing || consent == null || !consent.canRequestAds() || !policy.eligible(now) || cached == null) {
            call.resolve(new JSObject().put("shown", false)); preload(); return;
        }
        InterstitialAd ad = cached; cached = null; showing = true;
        ad.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override public void onAdShowedFullScreenContent() { policy.shown(SystemClock.elapsedRealtime()); }
            @Override public void onAdDismissedFullScreenContent() { showing = false; call.resolve(new JSObject().put("shown", true)); }
            @Override public void onAdFailedToShowFullScreenContent(@NonNull AdError error) { showing = false; call.resolve(new JSObject().put("shown", false)); }
        });
        ad.show(getActivity());
    }); }
    @PluginMethod public void privacy(PluginCall call) { getActivity().runOnUiThread(() -> {
        if (!enabled() || consent == null || !foreground || showing) { call.resolve(status()); return; }
        cached = null;
        UserMessagingPlatform.showPrivacyOptionsForm(getActivity(), error -> {
            if (error != null) { call.reject("Privacy choices unavailable"); return; }
            if (consent.canRequestAds()) initialize();
            call.resolve(status());
        });
    }); }
    @Override protected void handleOnPause() { foreground = false; }
    @Override protected void handleOnResume() { foreground = true; }
}
