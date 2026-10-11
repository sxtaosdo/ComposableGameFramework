import { describe, expect, it } from 'vitest';
import { AppleCredentialAdapter, GoogleCredentialAdapter, CocosNativeCredentialBridge, AuthSession } from '../../assets/auth/index';
import type { AuthClock, NativeCredentialBridge, NativeLoginProvider } from '../../assets/auth/index';

const scope = { issuer: 'synthetic-provider', applicationId: 'synthetic-app', host: 'synthetic-native' };
function fixture(provider: NativeLoginProvider = 'google') {
    let now = 1000, counter = 0, terminal: unknown | null = null;
    const calls: string[] = [], begins: { requestId: string; nonce: string }[] = [];
    const cancelled: string[] = [], timers = new Map<number, () => void>(), history: (() => void)[] = [];
    const clock: AuthClock = { now: () => now, schedule(callback) { const id = ++counter; timers.set(id, callback); history.push(callback); return id; },
        cancel(handle) { timers.delete(handle as number); } };
    const bridge: NativeCredentialBridge = {
        isConfigured() { calls.push('configured'); return true; },
        nonce() { calls.push('nonce'); return ('0'.repeat(64) + (++counter).toString(16)).slice(-64); },
        begin(requestId, nonce) { calls.push('begin'); begins.push({ requestId, nonce }); return true; },
        poll() { calls.push('poll'); const value = terminal; terminal = null; return value; },
        cancel(requestId) { calls.push('cancel'); cancelled.push(requestId); return true; },
    };
    const Adapter = provider === 'google' ? GoogleCredentialAdapter : AppleCredentialAdapter;
    const adapter = new Adapter({ enabled: true, scope, bridge, clock, timeoutMs: 500 });
    const success = (index = begins.length - 1) => ({ ...begins[index], provider, status: 'success', idToken: 'synthetic.id-token',
        ...(provider === 'apple' ? { authorizationCode: 'synthetic-auth-code' } : {}) });
    return { adapter, Adapter, bridge, clock, calls, begins, cancelled, timers, history, success,
        result(value: unknown) { terminal = value; }, time(value: number) { now = value; },
        tick() { const entry = timers.entries().next().value; if (entry) { timers.delete(entry[0]); entry[1](); } } };
}
describe.each(['google', 'apple'] as const)('%s native credential lifecycle', (provider: NativeLoginProvider) => {
    it('defaults off and never calls the bridge/clock at import, construction or unavailable acquire', async () => {
        const f = fixture(provider);
        const off = new f.Adapter({ scope, bridge: f.bridge, clock: f.clock });
        expect(f.calls).toEqual([]);
        await expect(off.acquire(new AbortController().signal)).rejects.toThrow('Platform credential unavailable');
        expect(f.calls).toEqual([]); expect(f.timers.size).toBe(0);
        const missing = new f.Adapter({ enabled: true, scope, clock: f.clock });
        await expect(missing.acquire(new AbortController().signal)).rejects.toThrow('Platform credential unavailable');
    });
    it('requires exact correlated one-shot materials and returns frozen proof without extra SDK fields', async () => {
        const f = fixture(provider), pending = f.adapter.acquire(new AbortController().signal);
        f.tick(); expect(f.calls.filter(c => c === 'poll')).toHaveLength(1);
        f.result({ ...f.success(), email: 'private', user: 'private', error: 'private' }); f.tick();
        const credential = await pending;
        expect(credential).toEqual({ provider, scope, proof: provider === 'google'
            ? { kind: 'google-id-token', idToken: 'synthetic.id-token', nonce: f.begins[0]!.nonce }
            : { kind: 'apple-id-token-code', idToken: 'synthetic.id-token', authorizationCode: 'synthetic-auth-code', nonce: f.begins[0]!.nonce } });
        expect(Object.isFrozen(credential.proof)).toBe(true); expect(Object.isFrozen(credential.scope)).toBe(true);
        expect(f.timers.size).toBe(0); f.history.forEach(callback => callback());
        expect(JSON.stringify(credential)).not.toContain('private');
    });
    it('rejects pre-abort and concurrent acquire; cancel removes owned timers and stale polling cannot consume new data', async () => {
        const f = fixture(provider), abort = new AbortController(); abort.abort();
        await expect(f.adapter.acquire(abort.signal)).rejects.toThrow('Platform credential unavailable'); expect(f.calls).toEqual([]);
        const firstAbort = new AbortController(), first = f.adapter.acquire(firstAbort.signal);
        const rejected = expect(first).rejects.toThrow('Platform credential unavailable');
        await expect(f.adapter.acquire(new AbortController().signal)).rejects.toThrow('Platform credential unavailable');
        const old = f.history[0]!; firstAbort.abort(); await rejected;
        expect(f.cancelled).toEqual([f.begins[0]!.requestId]); expect(f.timers.size).toBe(0);
        const next = f.adapter.acquire(new AbortController().signal); f.result(f.success()); old(); f.tick();
        expect((await next).provider).toBe(provider); expect(f.begins[1]!.requestId).not.toBe(f.begins[0]!.requestId);
    });
    it('expires the attempt before polling and ignores success returned after a reentrant timeout', async () => {
        const f = fixture(provider), pending = f.adapter.acquire(new AbortController().signal);
        const rejected = expect(pending).rejects.toThrow('Platform credential unavailable');
        f.time(1500); f.result(f.success()); f.tick(); await rejected; expect(f.calls).not.toContain('poll');
        f.time(2000); f.bridge.poll = () => { f.time(2500); return f.success(); };
        const late = f.adapter.acquire(new AbortController().signal); f.tick();
        await expect(late).rejects.toThrow('Platform credential unavailable');
    });
    it.each(['provider', 'requestId', 'nonce', 'status', 'idToken', 'accessor', 'inherited', 'oversize'])('rejects malformed %s without reading raw error/accessor fields', async (field: string) => {
        const f = fixture(provider), pending = f.adapter.acquire(new AbortController().signal); let reads = 0;
        const result: Record<string, unknown> = { ...f.success() };
        if (field === 'accessor') Object.defineProperty(result, 'idToken', { get() { reads++; throw Error('private'); } });
        else if (field === 'inherited') { const inherited = Object.create(result) as unknown; f.result(inherited); }
        else if (field === 'oversize') result.idToken = 'x'.repeat(16385);
        else result[field] = field === 'idToken' ? 'bad token' : 'wrong';
        Object.defineProperty(result, 'error', { get() { reads++; throw Error('private'); } });
        if (field !== 'inherited') f.result(result); f.tick();
        await expect(pending).rejects.toThrow('Platform credential unavailable'); expect(reads).toBe(0);
    });
    it('fails safely on configuration/random failure, synchronous scheduler and teardown', async () => {
        const f = fixture(provider); f.bridge.isConfigured = () => false;
        await expect(f.adapter.acquire(new AbortController().signal)).rejects.toThrow(); expect(f.begins).toHaveLength(0);
        f.bridge.isConfigured = () => true; f.bridge.nonce = () => 'non-cryptographic';
        await expect(f.adapter.acquire(new AbortController().signal)).rejects.toThrow(); expect(f.begins).toHaveLength(0);
        const sync = fixture(provider); let cancelled = 0;
        sync.clock.schedule = callback => { callback(); return 'own-handle'; }; sync.clock.cancel = () => { cancelled++; };
        await expect(sync.adapter.acquire(new AbortController().signal)).rejects.toThrow(); expect(cancelled).toBe(1);
        const disposed = fixture(provider), pending = disposed.adapter.acquire(new AbortController().signal);
        const rejected = expect(pending).rejects.toThrow(); disposed.adapter.dispose(); await rejected;
        await expect(disposed.adapter.acquire(new AbortController().signal)).rejects.toThrow(); expect(disposed.begins).toHaveLength(1);
    });
    it.each(['configured', 'nonce', 'begin', 'poll', 'schedule', 'now', 'begin-getter'])('invalidates before advancing after reentrant %s cancellation', async (point: string) => {
        const f = fixture(provider), abort = new AbortController(); let callsAfterAbort = 0;
        if (point === 'configured') f.bridge.isConfigured = () => { abort.abort(); return true; };
        if (point === 'nonce') f.bridge.nonce = () => { abort.abort(); return 'a'.repeat(64); };
        if (point === 'begin') f.bridge.begin = () => { abort.abort(); return true; };
        if (point === 'poll') f.bridge.poll = () => { abort.abort(); return f.success(); };
        if (point === 'schedule') f.clock.schedule = () => { abort.abort(); return 1; };
        if (point === 'now') f.clock.now = () => { abort.abort(); return 1000; };
        if (point === 'begin-getter') Object.defineProperty(f.bridge, 'begin', { get() { abort.abort(); return () => { callsAfterAbort++; return true; }; } });
        const pending = f.adapter.acquire(abort.signal); if (point === 'poll') f.tick();
        await expect(pending).rejects.toThrow('Platform credential unavailable');
        expect(f.timers.size).toBe(0); expect(callsAfterAbort).toBe(0);
        if (['configured', 'nonce', 'now', 'begin-getter'].indexOf(point) !== -1) expect(f.begins).toHaveLength(0);
    });
    it('requires a distinct trusted exchange, keeps proof out of snapshot and cancels before exchange', async () => {
        const f = fixture(provider); let exchanges = 0;
        const session = new AuthSession({ timeoutMs: 500, clock: f.clock, ports: { credential: f.adapter,
            exchange: { async exchange() { exchanges++; return { gameAccountId: 'synthetic-game', sessionId: 'synthetic-session', expiresAtMs: 3000 }; } } } });
        const pending = session.login(); expect(session.snapshot().status).toBe('pending');
        f.result(f.success()); // Poll timer is second after AuthSession timeout.
        const poll = f.history[1]!; poll(); session.cancel();
        expect((await pending).status).toBe('cancelled'); await Promise.resolve(); expect(exchanges).toBe(0);
        const active = session.login(); f.result(f.success()); f.history[f.history.length - 1]!();
        expect((await active).status).toBe('active'); expect(exchanges).toBe(1);
        expect(JSON.stringify(session.snapshot())).not.toContain('synthetic.id-token');
    });
});
describe('fixed Cocos native credential transport', () => {
    it('uses fixed Android signatures and bounded JSON; constructors and Apple Android are inert', () => {
        const calls: unknown[][] = []; let response: unknown = true;
        const reflection = { callStaticMethod(...args: unknown[]) { calls.push(args); return response; } };
        const bridge = new CocosNativeCredentialBridge(reflection, 'google', 'android'); expect(calls).toHaveLength(0);
        expect(bridge.begin('id', 'nonce')).toBe(true);
        expect(calls[0]).toEqual(['com/shidai3/platform/Shidai3GoogleCredential', 'begin', '(Ljava/lang/String;Ljava/lang/String;)Z', 'id', 'nonce']);
        response = ''; expect(bridge.poll('id')).toBeNull(); response = '{"status":"failed"}'; expect(bridge.poll('id')).toEqual({ status: 'failed' });
        response = 'x'.repeat(24577); expect(() => bridge.poll('id')).toThrow('Platform credential unavailable');
        response = 'private-invalid-json'; expect(() => bridge.poll('id')).toThrow('Platform credential unavailable');
        response = 'null'; expect(() => bridge.poll('id')).toThrow('Platform credential unavailable');
        const unsupported = new CocosNativeCredentialBridge(reflection, 'apple', 'android'); const count = calls.length;
        expect(unsupported.isConfigured()).toBe(false); expect(unsupported.begin('id', 'nonce')).toBe(false); expect(calls).toHaveLength(count);
    });
    it('uses fixed iOS selectors and generic failure without raw error propagation', () => {
        const calls: unknown[][] = [], bridge = new CocosNativeCredentialBridge({ callStaticMethod(...args) { calls.push(args); return true; } }, 'apple', 'ios');
        expect(bridge.begin('id', 'nonce')).toBe(true); expect(bridge.cancel('id')).toBe(true);
        expect(calls).toEqual([['Shidai3AppleCredential', 'begin:nonce:', 'id', 'nonce'], ['Shidai3AppleCredential', 'cancel:', 'id']]);
        const broken = new CocosNativeCredentialBridge({ callStaticMethod() { throw Error('private-raw'); } }, 'google', 'android');
        expect(broken.isConfigured()).toBe(false); expect(broken.begin('id', 'nonce')).toBe(false); expect(broken.cancel('id')).toBe(false);
        expect(() => broken.nonce()).toThrow('Platform credential unavailable'); expect(() => broken.poll('id')).toThrow('Platform credential unavailable');
    });
});
