package com.shidai3.platform;

import com.google.firebase.FirebaseApp;
import com.google.firebase.crashlytics.FirebaseCrashlytics;
import org.json.JSONObject;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/** Optional source: exclude this class and SDK from default builds. SDK initialization captures raw crashes. */
public final class Shidai3FirebaseCrashlytics {
    private static FirebaseCrashlytics sdk;
    private static boolean enabled;
    private static final Set<String> CODES = new HashSet<>(Arrays.asList("js_uncaught", "promise_unhandled",
        "resource_failed", "network_failed", "save_failed", "black_screen", "stalled"));
    private static final Set<String> OPERATIONS = new HashSet<>(Arrays.asList("boot", "resource", "network", "save", "gameplay", "switch"));
    private Shidai3FirebaseCrashlytics() {}

    /** Host initializes an approved TEST FirebaseApp separately. Neither gate defaults to true. */
    public static synchronized boolean configure(boolean allowAutomaticCapture, boolean allowUpload) {
        enabled = false;
        try {
            if (sdk != null) sdk.setCrashlyticsCollectionEnabled(false);
            if (!allowAutomaticCapture || !allowUpload) return false; // No getInstance on a default-off call.
            FirebaseApp.getInstance(); // Existing default app only, never initializeApp.
            sdk = FirebaseCrashlytics.getInstance();
            sdk.setCrashlyticsCollectionEnabled(false);
            sdk.setCrashlyticsCollectionEnabled(true);
            enabled = true;
            return true;
        } catch (RuntimeException | LinkageError failure) { return false; }
    }
    public static synchronized boolean isConfigured() { return enabled && sdk != null; }
    /** Android false override applies next launch; this bool only confirms the method returned. */
    public static synchronized boolean disable() {
        enabled = false;
        if (sdk == null) return true;
        try { sdk.setCrashlyticsCollectionEnabled(false); return true; }
        catch (RuntimeException | LinkageError failure) { return false; }
    }
    public static synchronized boolean record(String json) {
        if (!isConfigured() || json == null || json.length() > 256) return false;
        try {
            JSONObject input = new JSONObject(json);
            Object code = input.get("code"), operation = input.get("operation");
            if (input.length() != 2 || !(code instanceof String) || !(operation instanceof String)
                || !CODES.contains(code) || !OPERATIONS.contains(operation)) return false;
            sdk.recordException(new DiagnosticException((String)code, (String)operation));
            return true; // Queued by SDK, never a remote ACK.
        } catch (Exception | LinkageError failure) { return false; }
    }
    private static final class DiagnosticException extends Exception {
        DiagnosticException(String code, String operation) {
            super("shidai3:" + code + ":" + operation, null, false, false);
        }
    }
}
