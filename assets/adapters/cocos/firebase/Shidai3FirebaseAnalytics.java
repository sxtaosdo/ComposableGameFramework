package com.shidai3.platform;

import android.content.Context;
import android.os.Bundle;
import com.google.firebase.FirebaseApp;
import com.google.firebase.analytics.FirebaseAnalytics;
import org.json.JSONObject;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

/** Fixed Cocos reflection entry. No automatic init, account, raw error, or remote ACK. */
public final class Shidai3FirebaseAnalytics {
    private static FirebaseAnalytics analytics;
    private static boolean enabled;
    private static final Map<String, String[]> FIELDS = new HashMap<>();
    private static final Set<String> CONTEXT = new HashSet<>(Arrays.asList(
        "schemaVersion", "kind", "timestampMs", "product", "gameplay", "environment", "platform",
        "sessionId", "release", "commit", "buildId", "factId", "causationId"));
    static {
        FIELDS.put("session_started", new String[]{"entry"});
        FIELDS.put("session_ready", new String[]{"durationMs"});
        FIELDS.put("level_started", new String[]{"levelId", "mode"});
        FIELDS.put("level_finished", new String[]{"levelId", "outcome", "durationMs"});
        FIELDS.put("region_entered", new String[]{"regionId"});
        FIELDS.put("encounter_started", new String[]{"encounterId"});
        FIELDS.put("encounter_finished", new String[]{"encounterId", "outcome"});
        FIELDS.put("item_used", new String[]{"itemId", "quantity", "commitState"});
        FIELDS.put("currency_changed", new String[]{"currency", "before", "after", "delta", "reason", "commitState"});
        FIELDS.put("ad_shown", new String[]{"placementId"});
        FIELDS.put("ad_video_completed", new String[]{"placementId", "completed"});
        FIELDS.put("ad_reward_committed", new String[]{"placementId", "rewardType", "rewardCode", "amount", "commitState"});
        FIELDS.put("save_failed", new String[]{"operation", "code"});
        FIELDS.put("save_recovered", new String[]{"operation"});
        FIELDS.put("invite_presented", new String[]{"target"});
        FIELDS.put("invite_accepted", new String[]{"target"});
        FIELDS.put("gameplay_switch_completed", new String[]{"from", "to"});
        FIELDS.put("diagnostic_error", new String[]{"code", "operation"});
    }
    private Shidai3FirebaseAnalytics() {}

    /** Host explicitly initializes its test FirebaseApp with collection disabled before this gate. */
    public static synchronized boolean configure(Context context, boolean allowCollection) {
        enabled = false;
        FirebaseAnalytics previous = analytics;
        analytics = null;
        try {
            // Revoke the previous SDK gate before validating a replacement context/app.
            if (previous != null) previous.setAnalyticsCollectionEnabled(false);
            // Firebase's persisted collection state is independent of this class's static flag.
            // Access an existing default app only; never call initializeApp implicitly.
            FirebaseApp app = FirebaseApp.getInstance();
            FirebaseAnalytics candidate = FirebaseAnalytics.getInstance(app.getApplicationContext());
            candidate.setAnalyticsCollectionEnabled(false);
            if (!allowCollection || context == null) return false;
            analytics = candidate;
            analytics.setAnalyticsCollectionEnabled(true);
            enabled = true;
            return true;
        } catch (RuntimeException | LinkageError failure) { analytics = null; return false; }
    }
    public static synchronized boolean isConfigured() { return enabled && analytics != null; }

    /** Return true only after logEvent returns, never as a delivery acknowledgement. */
    public static synchronized boolean submit(String name, String parameters) {
        if (!isConfigured() || !FIELDS.containsKey(name) || parameters == null || parameters.length() > 8192) return false;
        try {
            JSONObject input = new JSONObject(parameters);
            Set<String> allowed = new HashSet<>(CONTEXT);
            allowed.addAll(Arrays.asList(FIELDS.get(name)));
            if (input.length() > 25 || !"native".equals(input.optString("platform"))
                || input.optInt("schemaVersion") != 1
                || !("diagnostic_error".equals(name) ? "error" : "event").equals(input.optString("kind"))) return false;
            for (String key : CONTEXT) if (!"causationId".equals(key) && !input.has(key)) return false;
            for (String key : FIELDS.get(name)) if (!input.has(key)) return false;
            if ("ad_reward_committed".equals(name) && !input.has("causationId")) return false;
            Bundle bundle = new Bundle();
            Iterator<String> keys = input.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                if (!allowed.contains(key)) return false;
                Object value = input.get(key);
                if (value instanceof String) {
                    String text = (String) value;
                    if (text.length() > 100 || !text.matches("[A-Za-z0-9_.:-]{1,100}")) return false;
                    bundle.putString(key, text);
                } else if (value instanceof Number) {
                    double numeric = ((Number) value).doubleValue();
                    if (!Double.isFinite(numeric) || numeric != Math.rint(numeric) || Math.abs(numeric) > 9007199254740991d) return false;
                    bundle.putLong(key, ((Number) value).longValue());
                } else return false;
            }
            analytics.logEvent(name, bundle);
            return true;
        } catch (Exception | LinkageError failure) { return false; }
    }
}
