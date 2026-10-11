import { describe, it, expect } from 'vitest';
import { TelemetryClient, LocalRecordingAdapter, WechatTelemetryAdapter, NativeFirebaseTelemetryAdapter,
    CocosFirebaseAnalyticsBridge, WechatErrorListener } from '../../assets/observability/index';
import type { TelemetryContext, TelemetryRecord, WechatErrorHandler } from '../../assets/observability/index';
const context: TelemetryContext = { product: 'p1060', gameplay: 'endless', environment: 'test', platform: 'wechat',
    sessionId: 'synthetic-session', release: '0.1.0.1', commit: 'abcdef1', buildId: 'synthetic-build' };
function records(platform: 'wechat' | 'native' = 'wechat'): readonly TelemetryRecord[] {
    const local = new LocalRecordingAdapter();
    const client = new TelemetryClient({ context: { ...context, platform }, enabled: true, adapter: local, now: () => 1 });
    client.track('session_started', { entry: 'launch' }, { factId: 'launch' });
    client.track('session_ready', { durationMs: 100 }, { factId: 'ready' }); client.flush();
    return local.snapshot();
}
describe('SDK adapters with synthetic data only', () => {
    it('keeps all official calls off unless API and event configuration are explicitly enabled', () => {
        let calls = 0;
        for (const options of [{}, { enabled: true }, { api: { reportEvent() { calls++; } } },
            { enabled: true, api: { reportEvent() { calls++; } } }]) {
            const adapter = new WechatTelemetryAdapter(options);
            expect(adapter.accept(records())).toBe('not_configured'); expect(adapter.capabilities.configured).toBe(false);
        }
        const adapter = new NativeFirebaseTelemetryAdapter({ bridge: { isConfigured() { calls++; return true; }, submit() { calls++; return true; } } });
        expect(adapter.accept(records('native'))).toBe('not_configured'); expect(calls).toBe(0);
    });
    it('submits official wx.reportEvent payloads without claiming reception; client removes accepted batch', () => {
        const sent: unknown[] = [];
        const adapter = new WechatTelemetryAdapter({ enabled: true, configuredEvents: ['session_started'],
            api: { reportEvent(name, params) { sent.push({ name, params }); } } });
        const client = new TelemetryClient({ context, enabled: true, adapter, now: () => 1 });
        expect(client.track('session_started', { entry: 'launch' }, { factId: 'launch' })).toBe('queued');
        expect(client.flush()).toEqual({ status: 'submitted_to_sdk', accepted: 1, pending: 0 });
        expect(sent).toHaveLength(1); expect(JSON.stringify(sent)).not.toContain('eventId');
        expect(adapter.capabilities.rawErrorCapture).toBe(false);
    });
    it('retries only the unsent suffix after an SDK exception; unregistered batches call nothing', () => {
        let fail = true; const sent: string[] = [];
        const batch = records();
        const adapter = new WechatTelemetryAdapter({ enabled: true, configuredEvents: ['session_started', 'session_ready'],
            api: { reportEvent(name) { if (name === 'session_ready' && fail) throw Error('synthetic failure'); sent.push(name); } } });
        expect(adapter.accept(batch)).toBe('retry'); fail = false;
        expect(adapter.accept(batch)).toBe('submitted_to_sdk');
        expect(sent).toEqual(['session_started', 'session_ready']);
        const other = new WechatTelemetryAdapter({ enabled: true, configuredEvents: ['session_started'],
            api: { reportEvent() { throw Error('must not call'); } } });
        expect(other.accept(batch)).toBe('not_configured');
    });
    it('revalidates direct adapter records, ignores unknown getters and rejects forged identity/name/platform', () => {
        let reads = 0, sends = 0;
        const adapter = new WechatTelemetryAdapter({ enabled: true, configuredEvents: ['session_started', 'session_ready'],
            api: { reportEvent(_name, parameters) { sends++; expect('accountId' in parameters).toBe(false); } } });
        const [first] = records(); if (!first) throw Error('fixture');
        const extra = Object.defineProperty({ ...first }, 'accountId', { get() { reads++; throw Error('secret'); } });
        expect(adapter.accept([extra])).toBe('submitted_to_sdk');
        for (const bad of [{ ...first, eventId: 'forged' }, { ...first, name: 'raw_error' },
            { ...first, context: { ...context, platform: 'native' } }, { ...first, kind: 'breadcrumb' }]) {
            expect(adapter.accept([bad as TelemetryRecord])).toBe('retry');
        }
        expect(reads).toBe(0); expect(sends).toBe(1);
    });
    it('native configuration and exact boolean SDK acceptance govern queue removal', () => {
        let configured = false, success = false; const sent: string[] = [];
        const adapter = new NativeFirebaseTelemetryAdapter({ enabled: true, bridge: {
            isConfigured: () => configured, submit(name) { if (success) sent.push(name); return success; },
        } });
        expect(adapter.accept(records('native'))).toBe('not_configured');
        configured = true; expect(adapter.accept(records('native'))).toBe('retry');
        success = true; expect(adapter.accept(records('native'))).toBe('submitted_to_sdk');
        expect(sent).toEqual(['session_started', 'session_ready']);
        expect(adapter.capabilities.nativeCrashCapture).toBe(false);
    });
    it('uses exact Cocos native reflection signatures and never serializes callers raw object', () => {
        const args: unknown[][] = []; let answer: unknown = true, reads = 0;
        const reflection = { callStaticMethod(...input: unknown[]) { args.push(input); return answer; } };
        for (const platform of ['android', 'ios'] as const) {
            const bridge = new CocosFirebaseAnalyticsBridge(reflection, platform);
            expect(bridge.isConfigured()).toBe(true);
            const received: { params?: Readonly<Record<string, string | number>> } = {};
            const adapter = new NativeFirebaseTelemetryAdapter({ enabled: true, bridge: { isConfigured: () => true,
                submit(_name, params) { received.params = params; return true; } } });
            adapter.accept(records('native'));
            const params = Object.defineProperty({ ...received.params }, 'secret', { get() { reads++; throw Error('private'); } });
            expect(bridge.submit('session_ready', params)).toBe(true);
            const call = args[args.length - 1];
            expect(call?.[1]).toBe(platform === 'android' ? 'submit' : 'submit:parameters:');
            expect(call?.[2]).toBe(platform === 'android' ? '(Ljava/lang/String;Ljava/lang/String;)Z' : 'session_ready');
            answer = undefined; expect(bridge.isConfigured()).toBe(false);
            expect(bridge.submit('session_ready', params)).toBe(false);
            answer = true; expect(bridge.submit('arbitrary', params)).toBe(false);
        }
        expect(reads).toBe(0);
    });
    it('error listener owns its handler, ignores raw content, never auto-flushes and makes stopped callbacks inert', () => {
        let handler: WechatErrorHandler | undefined; const removed: WechatErrorHandler[] = [];
        const local = new LocalRecordingAdapter();
        const client = new TelemetryClient({ context, enabled: true, adapter: local, now: () => 1 });
        const listener = new WechatErrorListener({ onError(value) { handler = value; }, offError(value) { removed.push(value); } }, client);
        expect(listener.start()).toBe(false); expect(handler).toBeUndefined();
        expect(listener.start(true)).toBe(true); expect(listener.start(true)).toBe(true);
        const raw = new Proxy({}, { get() { throw Error('private raw getter'); } }); handler?.(raw);
        expect(local.snapshot()).toHaveLength(0); listener.stop(); listener.stop(); handler?.(raw);
        expect(removed).toEqual([handler]); expect(client.flush().accepted).toBe(1);
        expect(local.snapshot()[0]?.fields).toEqual({ code: 'js_uncaught', operation: 'gameplay' });
    });
});
