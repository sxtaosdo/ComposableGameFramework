package com.shidai3.platform;

import android.app.Activity;
import android.os.CancellationSignal;
import android.os.Handler;
import android.os.Looper;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.credentials.exceptions.GetCredentialException;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;
import java.lang.ref.WeakReference;
import java.security.SecureRandom;
import java.util.concurrent.Executor;
import org.json.JSONObject;

/** Optional host-installed bridge. No account configuration, automatic sign-in or SDK initialization. */
public final class Shidai3GoogleCredential {
    private static final Handler MAIN = new Handler(Looper.getMainLooper());
    private static WeakReference<Activity> host = new WeakReference<>(null);
    private static String serverClientId = "";
    private static boolean enabled;
    private static Request active;
    private static final class Request {
        final String id, nonce;
        final CancellationSignal cancellation = new CancellationSignal();
        String result;
        Runnable expiry;
        Request(String id, String nonce) { this.id = id; this.nonce = nonce; }
    }
    private Shidai3GoogleCredential() {}

    /** Call again with null/false during Activity teardown. Client ID is public OAuth metadata. */
    public static synchronized void configure(Activity activity, String webServerClientId, boolean allow) {
        if (active != null) cancel(active.id);
        host = new WeakReference<>(activity);
        serverClientId = webServerClientId == null ? "" : webServerClientId;
        enabled = allow && !serverClientId.isEmpty() && serverClientId.length() <= 256;
    }
    public static synchronized boolean isConfigured() {
        Activity activity = host.get();
        return enabled && activity != null && !activity.isFinishing() && !activity.isDestroyed();
    }
    public static String nonce() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        StringBuilder hex = new StringBuilder(64);
        for (byte value : bytes) hex.append(String.format(java.util.Locale.ROOT, "%02x", value & 255));
        java.util.Arrays.fill(bytes, (byte) 0);
        return hex.toString();
    }
    private static boolean random(String value) { return value != null && value.matches("[a-f0-9]{64}"); }
    private static boolean opaque(String value, int maximum) {
        return value != null && !value.isEmpty() && value.length() <= maximum
            && !java.util.regex.Pattern.compile("[\\s\\x00-\\x1f\\x7f]").matcher(value).find();
    }
    public static synchronized boolean begin(String requestId, String nonce) {
        if (!isConfigured() || active != null || !random(requestId) || !random(nonce) || requestId.equals(nonce)) return false;
        Request request = new Request(requestId, nonce);
        active = request;
        request.expiry = () -> { synchronized (Shidai3GoogleCredential.class) { if (active == request) cancel(request.id); } };
        MAIN.postDelayed(request.expiry, 60000);
        MAIN.post(() -> start(request));
        return true;
    }
    private static synchronized void start(Request request) {
        if (active != request) return;
        Activity activity = host.get();
        if (!isConfigured() || activity == null) { complete(request, "failed", null); return; }
        try {
            GetSignInWithGoogleOption option = new GetSignInWithGoogleOption.Builder(serverClientId).setNonce(request.nonce).build();
            GetCredentialRequest query = new GetCredentialRequest.Builder().addCredentialOption(option).build();
            Executor executor = command -> MAIN.post(command);
            CredentialManager.create(activity).getCredentialAsync(activity, query, request.cancellation, executor,
                new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override public void onResult(GetCredentialResponse response) {
                        synchronized (Shidai3GoogleCredential.class) {
                            if (active != request || request.result != null) return;
                            try {
                                if (!(response.getCredential() instanceof CustomCredential)
                                    || !GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(response.getCredential().getType())) {
                                    complete(request, "failed", null); return;
                                }
                                String token = GoogleIdTokenCredential.createFrom(response.getCredential().getData()).getIdToken();
                                complete(request, opaque(token, 16384) ? "success" : "failed", token);
                            } catch (Exception ignored) { complete(request, "failed", null); }
                        }
                    }
                    @Override public void onError(GetCredentialException error) {
                        complete(request, error instanceof GetCredentialCancellationException ? "cancelled" : "failed", null);
                    }
                });
        } catch (Exception ignored) { complete(request, "failed", null); }
    }
    private static synchronized void complete(Request request, String status, String token) {
        if (active != request || request.result != null) return;
        try {
            JSONObject result = new JSONObject().put("provider", "google").put("requestId", request.id)
                .put("nonce", request.nonce).put("status", status);
            if ("success".equals(status)) result.put("idToken", token);
            request.result = result.toString();
        } catch (Exception ignored) { cancel(request.id); }
    }
    /** Empty means pending/unavailable; a matching terminal result is consumed exactly once. */
    public static synchronized String poll(String requestId) {
        if (active == null || !active.id.equals(requestId) || active.result == null) return "";
        Request request = active;
        active = null;
        MAIN.removeCallbacks(request.expiry);
        String result = request.result;
        request.result = null;
        return result;
    }
    /** Invalidates before platform cancellation. Never clears an existing SDK account or signs out. */
    public static synchronized boolean cancel(String requestId) {
        if (active == null || !active.id.equals(requestId)) return false;
        Request request = active;
        active = null;
        request.result = null;
        MAIN.removeCallbacks(request.expiry);
        try { request.cancellation.cancel(); } catch (Exception ignored) { /* best effort */ }
        return true;
    }
}
