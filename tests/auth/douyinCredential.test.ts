import { describe, it, expect, vi } from 'vitest';
import { AuthSession, LoginFacade, DouyinCredentialAdapter } from '../../assets/auth/index';
import type { DouyinLoginApi, PlatformCredential, SessionIdentity } from '../../assets/auth/index';

const scope = { issuer: 'douyin-fixture', applicationId: 'synthetic-application', host: 'douyin-minigame' };
const config = { enabled: true, platformConfigured: true, provider: 'douyin' as const, scope };
const clock = { now: () => 100, schedule: () => 1, cancel: () => {} };
function fixture() {
    const requests: Parameters<DouyinLoginApi['login']>[0][] = [];
    const api: DouyinLoginApi = { login(options) { expect(this).toBe(api); requests.push(options); } };
    return { adapter: new DouyinCredentialAdapter(api, scope), requests };
}
describe('Douyin minigame credential boundary with synthetic callbacks only', () => {
    it('constructs without reading the API and keeps default-off and missing-exchange facades playable', async () => {
        let reads = 0;
        const api: DouyinLoginApi = { get login(): DouyinLoginApi['login'] { reads++; throw Error('unused API'); } };
        const adapter = new DouyinCredentialAdapter(api, scope);
        const off = new LoginFacade({ clock, credential: adapter });
        const incomplete = new LoginFacade({ clock, config, credential: adapter });
        expect((await off.requestLogin()).status).toBe('unavailable');
        expect(incomplete.readiness().status).toBe('missing-exchange-port');
        expect((await incomplete.requestLogin()).status).toBe('unavailable');
        expect(incomplete.snapshot().auth.status).toBe('guest');
        expect(incomplete.snapshot().localPlayAvailable).toBe(true); expect(reads).toBe(0);
    });
    it('passes only supported options with explicit force and preserves the injected API receiver', async () => {
        const f = fixture(); const result = f.adapter.acquire(new AbortController().signal);
        expect(Object.keys(f.requests[0] || {}).sort()).toEqual(['fail', 'force', 'success']);
        expect(f.requests[0]?.force).toBe(true);
        f.requests[0]?.success({ code: 'opaque+/=.-code' });
        expect(await result).toEqual({ provider: 'douyin', scope, proof: { kind: 'douyin-code', code: 'opaque+/=.-code' } });
    });
    it('copies immutable code metadata and optional anonymousCode without inspecting other SDK fields', async () => {
        let reads = 0;
        const mutableScope = { ...scope }; const requests: Parameters<DouyinLoginApi['login']>[0][] = [];
        const adapter = new DouyinCredentialAdapter({ login(options) { requests.push(options); } }, mutableScope);
        mutableScope.applicationId = 'changed'; const result = adapter.acquire(new AbortController().signal);
        const response = { code: 'synthetic-code', anonymousCode: 'synthetic-anonymous' };
        for (const key of ['isLogin', 'errMsg', 'session_key', 'openid']) {
            Object.defineProperty(response, key, { get() { reads++; throw Error('private SDK field'); } });
        }
        requests[0]?.success(response); const credential = await result;
        response.code = 'changed'; response.anonymousCode = 'changed';
        expect(credential).toEqual({ provider: 'douyin', scope,
            proof: { kind: 'douyin-code', code: 'synthetic-code', anonymousCode: 'synthetic-anonymous' } });
        expect(Object.isFrozen(credential)).toBe(true); expect(Object.isFrozen(credential.scope)).toBe(true);
        expect(Object.isFrozen(credential.proof)).toBe(true); expect(reads).toBe(0);
    });
    it('rejects anonymous-only, inherited or malformed codes', async () => {
        for (const response of [null, undefined, 'raw', {}, { anonymousCode: 'anonymous-only' },
            Object.create({ code: 'inherited' }), { code: '' }, { code: 123 }, { code: ' spaced' },
            { code: 'control\n' }, { code: '\u007f' }, { code: 'a'.repeat(4097) }]) {
            const f = fixture(); const result = f.adapter.acquire(new AbortController().signal);
            const failed = expect(result).rejects.toThrow('Platform credential unavailable');
            f.requests[0]?.success(response); await failed;
        }
    });
    it('rejects known getter fields and bad optional codes without invoking their getters', async () => {
        let reads = 0;
        const getter = { get() { reads++; throw Error('private code'); } };
        for (const response of [Object.defineProperty({}, 'code', getter),
            Object.defineProperty({ code: 'valid' }, 'anonymousCode', getter),
            { code: 'valid', anonymousCode: '' }, { code: 'valid', anonymousCode: 123 },
            { code: 'valid', anonymousCode: ' spaced' }, { code: 'valid', anonymousCode: 'a'.repeat(4097) }]) {
            const f = fixture(); const result = f.adapter.acquire(new AbortController().signal);
            const failed = expect(result).rejects.toThrow('Platform credential unavailable');
            f.requests[0]?.success(response); await failed;
        }
        expect(reads).toBe(0);
    });
    it('accepts bounded opaque strings and omits an undefined optional code', async () => {
        const f = fixture(); const result = f.adapter.acquire(new AbortController().signal);
        f.requests[0]?.success({ code: 'a'.repeat(4096), anonymousCode: undefined });
        const credential = await result; expect(credential.proof).not.toHaveProperty('anonymousCode');
        expect(credential.proof).toHaveProperty('code', 'a'.repeat(4096));
    });
    it('never calls the platform for a pre-aborted request', async () => {
        const f = fixture(), controller = new AbortController(); controller.abort();
        await expect(f.adapter.acquire(controller.signal)).rejects.toThrow('Platform credential unavailable');
        expect(f.requests).toHaveLength(0);
    });
    it('cancels local waiting, ignores late callbacks and never inspects or cancels an SDK return value', async () => {
        let returnReads = 0; const requests: Parameters<DouyinLoginApi['login']>[0][] = [];
        const adapter = new DouyinCredentialAdapter({ login(options) {
            requests.push(options); return new Proxy({}, { get() { returnReads++; throw Error('undocumented Task'); } });
        } }, scope);
        const controller = new AbortController(); const result = adapter.acquire(controller.signal);
        const failed = expect(result).rejects.toThrow('Platform credential unavailable');
        controller.abort(); await failed;
        requests[0]?.success(new Proxy({}, { getOwnPropertyDescriptor() { throw Error('late raw callback'); } }));
        requests[0]?.fail('late private error'); expect(returnReads).toBe(0);
    });
    it('detaches its owned abort listener on success and failure', async () => {
        for (const success of [true, false]) {
            const f = fixture(), controller = new AbortController();
            const signal = controller.signal;
            const removed = vi.spyOn(signal, 'removeEventListener');
            const result = f.adapter.acquire(signal);
            if (success) { f.requests[0]?.success({ code: 'synthetic-code' }); await result; }
            else { const failed = expect(result).rejects.toThrow('Platform credential unavailable'); f.requests[0]?.fail(null); await failed; }
            expect(removed).toHaveBeenCalledTimes(1); expect(removed).toHaveBeenCalledWith('abort', expect.any(Function));
            controller.abort(); expect(removed).toHaveBeenCalledTimes(1); removed.mockRestore();
        }
    });
    it('normalizes all platform fail callbacks and synchronous throws without reading raw errors', async () => {
        let reads = 0;
        const raw = new Proxy({}, { get() { reads++; throw Error('private SDK error'); } });
        const f = fixture(); const result = f.adapter.acquire(new AbortController().signal);
        const failed = expect(result).rejects.toThrow('Platform credential unavailable'); f.requests[0]?.fail(raw); await failed;
        const throwing = new DouyinCredentialAdapter({ login() { throw raw; } }, scope);
        await expect(throwing.acquire(new AbortController().signal)).rejects.toThrow('Platform credential unavailable');
        expect(reads).toBe(0);
    });
    it('settles only once when the SDK duplicates success/fail callbacks or throws after success', async () => {
        const adapter = new DouyinCredentialAdapter({ login(options) {
            options.success({ code: 'first' }); options.success({ code: 'second' }); options.fail('late'); throw Error('late');
        } }, scope);
        expect((await adapter.acquire(new AbortController().signal)).proof).toHaveProperty('code', 'first');
    });
    it('does not invoke a method whose lookup synchronously aborts the request', async () => {
        let calls = 0; const controller = new AbortController();
        const api: DouyinLoginApi = { get login() { controller.abort(); return () => { calls++; }; } };
        const adapter = new DouyinCredentialAdapter(api, scope);
        await expect(adapter.acquire(controller.signal)).rejects.toThrow('Platform credential unavailable');
        expect(calls).toBe(0);
    });
    it('keeps ready startup inert and requires trusted exchange before active, with shared concurrent requests', async () => {
        const f = fixture(); const proofs: PlatformCredential[] = []; let grant: ((value: SessionIdentity) => void) | undefined;
        const facade = new LoginFacade({ clock, config, credential: f.adapter,
            exchange: { exchange(proof) { proofs.push(proof); return new Promise(resolve => { grant = resolve; }); } } });
        expect(facade.readiness().status).toBe('ready'); expect(facade.snapshot().auth.status).toBe('guest');
        expect(f.requests).toHaveLength(0);
        const first = facade.requestLogin(); expect(facade.requestLogin()).toBe(first); expect(f.requests).toHaveLength(1);
        f.requests[0]?.success({ code: 'synthetic-proof' }); await Promise.resolve();
        expect(proofs).toHaveLength(1); expect(facade.snapshot().auth.status).toBe('pending');
        expect(JSON.stringify(facade.snapshot())).not.toContain('synthetic-proof');
        grant?.({ gameAccountId: 'synthetic-account', sessionId: 'synthetic-session', expiresAtMs: 1000 });
        expect((await first).status).toBe('active'); expect(facade.snapshot().localPlayAvailable).toBe(true);
        expect(JSON.stringify(facade.snapshot())).not.toContain('synthetic-proof'); facade.dispose();
    });
    it('uses the existing total deadline to abort local acquisition and refuses late exchange', async () => {
        const f = fixture(); let timeout: (() => void) | undefined, exchanges = 0, cancellations = 0;
        const session = new AuthSession({ timeoutMs: 1000,
            clock: { now: () => 100, schedule(callback) { timeout = callback; return 1; }, cancel() { cancellations++; } },
            ports: { credential: f.adapter, exchange: { async exchange() { exchanges++; throw Error('late exchange'); } } } });
        const result = session.login(); timeout?.();
        expect(await result).toEqual({ status: 'timeout' });
        f.requests[0]?.success({ code: 'late-code' }); await Promise.resolve();
        expect(exchanges).toBe(0); expect(cancellations).toBe(1); expect(session.snapshot().status).toBe('guest');
    });
    it('local cancel and SDK fail leave guest playable and never send anonymous-only proof to exchange', async () => {
        for (const outcome of ['cancel', 'fail', 'anonymous'] as const) {
            const f = fixture(); let exchanges = 0;
            const facade = new LoginFacade({ clock, config, credential: f.adapter,
                exchange: { async exchange() { exchanges++; throw Error('must not exchange'); } } });
            const result = facade.requestLogin();
            if (outcome === 'cancel') { facade.cancel(); f.requests[0]?.success({ code: 'late-code' }); }
            else if (outcome === 'fail') f.requests[0]?.fail({ errNo: 21101, errMsg: 'raw platform details' });
            else f.requests[0]?.success({ isLogin: false, anonymousCode: 'anonymous-only' });
            expect((await result).status).toBe(outcome === 'cancel' ? 'cancelled' : 'failed');
            expect(facade.snapshot().auth.status).toBe('guest'); expect(facade.snapshot().localPlayAvailable).toBe(true);
            expect(exchanges).toBe(0);
        }
    });
});
