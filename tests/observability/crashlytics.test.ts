import { describe, it, expect } from 'vitest';
import { TelemetryClient, LocalRecordingAdapter, NativeFirebaseCrashlyticsAdapter,
    CocosFirebaseCrashlyticsBridge } from '../../assets/observability/index';
import type { TelemetryContext, TelemetryRecord } from '../../assets/observability/index';
const context: TelemetryContext = { product: 'p1060', gameplay: 'endless', environment: 'test', platform: 'native',
    sessionId: 'synthetic-crash', release: '0.1.0.1', commit: 'abcdef1', buildId: 'synthetic-only' };
function errors(): readonly TelemetryRecord[] {
    const local = new LocalRecordingAdapter();
    const client = new TelemetryClient({ context, enabled: true, adapter: local, now: () => 1 });
    client.captureError(null, { code: 'resource_failed', operation: 'resource', factId: 'first' });
    client.captureError(null, { code: 'save_failed', operation: 'save', factId: 'second' });
    client.flush(); return local.snapshot();
}
describe('Crashlytics client contract with synthetic ports only', () => {
    it('never reads or calls the bridge without BOTH client and automatic capture build gates', () => {
        let calls = 0;
        const bridge = { isConfigured() { calls++; return true; }, record() { calls++; return true; }, disable() { calls++; return true; } };
        for (const options of [{}, { enabled: true }, { bridge }, { enabled: true, bridge },
            { automaticCaptureEnabledInBuild: true, bridge }]) {
            const adapter = new NativeFirebaseCrashlyticsAdapter(options);
            expect(adapter.accept(errors())).toBe('not_configured');
            expect(adapter.stop()).toBe('disabled_locally');
        }
        expect(calls).toBe(0);
    });
    it('uses captureError queue and ignores raw cause getters; acceptance is local SDK submission', () => {
        const sent: unknown[] = []; let reads = 0;
        const adapter = new NativeFirebaseCrashlyticsAdapter({ enabled: true, automaticCaptureEnabledInBuild: true,
            bridge: { isConfigured: () => true, record(code, operation) { sent.push({ code, operation }); return true; }, disable: () => true } });
        const client = new TelemetryClient({ context, enabled: true, adapter, now: () => 1 });
        const raw = new Proxy({}, { get() { reads++; throw Error('must not read'); } });
        expect(client.captureError(raw, { code: 'js_uncaught', operation: 'gameplay', factId: 'synthetic-fault' })).toBe('queued');
        expect(client.captureError(raw, { code: 'js_uncaught', operation: 'gameplay', factId: 'retry-fault' })).toBe('limited');
        expect(client.flush()).toEqual({ status: 'submitted_to_sdk', accepted: 1, pending: 0 });
        expect(sent).toEqual([{ code: 'js_uncaught', operation: 'gameplay' }]); expect(reads).toBe(0);
        expect(adapter.capabilities.rawErrorCapture).toBe(true);
    });
    it('rejects event/error mixtures and invalid direct records before any SDK submission', () => {
        let sends = 0;
        const adapter = new NativeFirebaseCrashlyticsAdapter({ enabled: true, automaticCaptureEnabledInBuild: true,
            bridge: { isConfigured: () => true, record() { sends++; return true; }, disable: () => true } });
        const first = errors()[0]; if (!first) throw Error('fixture');
        const local = new LocalRecordingAdapter();
        const client = new TelemetryClient({ context, enabled: true, adapter: local, now: () => 1 });
        client.track('session_started', { entry: 'launch' }, { factId: 'event' }); client.flush();
        expect(adapter.accept([first, ...local.snapshot()])).toBe('retry');
        expect(adapter.accept([{ ...first, eventId: 'forged' }])).toBe('retry');
        expect(sends).toBe(0);
    });
    it('keeps successful prefix in a bounded ledger while retrying only the failed suffix', () => {
        let fail = true; const sent: string[] = [];
        const adapter = new NativeFirebaseCrashlyticsAdapter({ enabled: true, automaticCaptureEnabledInBuild: true,
            bridge: { isConfigured: () => true, record(code) { if (code === 'save_failed' && fail) return false; sent.push(code); return true; }, disable: () => true } });
        expect(adapter.accept(errors())).toBe('retry'); fail = false;
        expect(adapter.accept(errors())).toBe('submitted_to_sdk');
        expect(sent).toEqual(['resource_failed', 'save_failed']);
    });
    it('stop is idempotent and never claims automatic raw/native capture ended', () => {
        let stops = 0;
        const adapter = new NativeFirebaseCrashlyticsAdapter({ enabled: true, automaticCaptureEnabledInBuild: true,
            bridge: { isConfigured: () => true, record: () => true, disable() { stops++; return true; } } });
        expect(adapter.stop()).toBe('sdk_disable_requested');
        expect(adapter.stop()).toBe('disabled_locally'); expect(stops).toBe(1);
        expect(adapter.accept(errors())).toBe('not_configured');
        expect(adapter.capabilities).toMatchObject({ configured: false, externalDelivery: false, rawErrorCapture: true, nativeCrashCapture: true });
    });
    it('SDK disable failure still stops this client and reports failure without recursive telemetry', () => {
        const adapter = new NativeFirebaseCrashlyticsAdapter({ enabled: true, automaticCaptureEnabledInBuild: true,
            bridge: { isConfigured: () => true, record: () => true, disable() { throw Error('synthetic'); } } });
        expect(adapter.stop()).toBe('sdk_disable_failed'); expect(adapter.accept(errors())).toBe('not_configured');
        const unavailable = new NativeFirebaseCrashlyticsAdapter({ enabled: true, automaticCaptureEnabledInBuild: true,
            bridge: { isConfigured() { throw Error('synthetic'); }, record: () => true, disable: () => false } });
        expect(unavailable.accept(errors())).toBe('not_configured');
    });
    it('synchronous stop during readiness, clock or the first record prevents subsequent submissions', () => {
        for (const phase of ['ready', 'clock', 'record'] as const) {
            let calls = 0;
            const adapter: NativeFirebaseCrashlyticsAdapter = new NativeFirebaseCrashlyticsAdapter({ enabled: true,
                automaticCaptureEnabledInBuild: true,
                now() { if (phase === 'clock') adapter.stop(); return 1; },
                bridge: { isConfigured() { if (phase === 'ready') adapter.stop(); return true; },
                    record() { calls++; if (phase === 'record') adapter.stop(); return true; }, disable: () => false } });
            expect(adapter.accept(errors())).toBe(phase === 'ready' ? 'not_configured' : 'retry');
            expect(calls).toBe(phase === 'record' ? 1 : 0);
        }
    });
    it('pins reflection signatures, finite enums and exact boolean acceptance on both platforms', () => {
        const calls: unknown[][] = []; let result: unknown = true;
        for (const platform of ['android', 'ios'] as const) {
            const bridge = new CocosFirebaseCrashlyticsBridge({ callStaticMethod(...args) { calls.push(args); return result; } }, platform);
            expect(bridge.isConfigured()).toBe(true); expect(bridge.record('js_uncaught', 'gameplay')).toBe(true);
            const call = calls[calls.length - 1];
            expect(call?.[1]).toBe(platform === 'android' ? 'record' : 'record:');
            expect(call?.[2]).toBe(platform === 'android' ? '(Ljava/lang/String;)Z' : '{"code":"js_uncaught","operation":"gameplay"}');
            const count = calls.length; expect(bridge.record('raw message', 'gameplay')).toBe(false); expect(calls).toHaveLength(count);
            expect(bridge.disable()).toBe(true); result = undefined;
            expect(bridge.record('js_uncaught', 'gameplay')).toBe(false); expect(bridge.disable()).toBe(false); result = true;
        }
    });
});
