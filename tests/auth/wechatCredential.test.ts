import { describe, it, expect } from 'vitest';
import { AuthSession, WechatCredentialAdapter } from '../../assets/auth/index';
import type { WechatLoginApi } from '../../assets/auth/index';

const scope = { issuer: 'wechat', applicationId: 'synthetic-application', host: 'wechat-minigame' };
function fixture() {
    const requests: Parameters<WechatLoginApi['login']>[0][] = [];
    const adapter = new WechatCredentialAdapter({ login(options) { requests.push(options); } }, scope, 5000);
    return { adapter, requests };
}
describe('Wechat official login callback boundary', () => {
    it('imports and constructs without reading wx or requesting a code; missing exchange stays guest', async () => {
        const f = fixture();
        const session = new AuthSession({ clock: { now: () => 0, schedule: () => 0, cancel: () => {} }, timeoutMs: 1000 });
        expect(await session.login()).toEqual({ status: 'unavailable' });
        expect(f.requests).toHaveLength(0);
        expect(session.snapshot()).toEqual({ status: 'guest' });
    });
    it('forwards the configured deadline and returns only one temporary code to the exchange owner', async () => {
        const f = fixture();
        const result = f.adapter.acquire(new AbortController().signal);
        expect(f.requests[0]?.timeout).toBe(5000);
        f.requests[0]?.success({ code: 'synthetic_code-1', ...{ session_key: 'must-not-escape' } });
        expect(await result).toEqual({ provider: 'wechat', scope, proof: { kind: 'wechat-code', code: 'synthetic_code-1' } });
        f.requests[0]?.success({ code: 'late-code' });
    });
    it('cancels promptly, ignores late callbacks, and never calls wx on a pre-aborted signal', async () => {
        const f = fixture(), abort = new AbortController();
        const result = f.adapter.acquire(abort.signal);
        const rejected = expect(result).rejects.toThrow('Platform credential unavailable');
        abort.abort(); await rejected;
        f.requests[0]?.success({ code: 'late-code' });
        f.requests[0]?.fail(new Error('late-private-error'));
        await expect(f.adapter.acquire(abort.signal)).rejects.toThrow('Platform credential unavailable');
        expect(f.requests).toHaveLength(1);
    });
    it('rejects bad or accessor codes and does not inspect raw SDK errors', async () => {
        const f = fixture(); let reads = 0;
        const bad = f.adapter.acquire(new AbortController().signal);
        f.requests[0]?.success(Object.defineProperty({}, 'code', { get() { reads++; throw Error('private'); } }) as { code: string });
        await expect(bad).rejects.toThrow('Platform credential unavailable');
        const failed = f.adapter.acquire(new AbortController().signal);
        f.requests[1]?.fail(Object.defineProperty({}, 'errMsg', { get() { reads++; throw Error('private'); } }));
        await expect(failed).rejects.toThrow('Platform credential unavailable');
        expect(reads).toBe(0);
    });
    it('requires trusted exchange after wx success before a game identity becomes active', async () => {
        const f = fixture(); const proofs: unknown[] = [];
        const session = new AuthSession({ timeoutMs: 5000, clock: { now: () => 100, schedule: () => 1, cancel: () => {} },
            ports: { credential: f.adapter, exchange: { async exchange(proof) {
                proofs.push(proof); return { gameAccountId: 'synthetic-account', sessionId: 'synthetic-session', expiresAtMs: 10000 };
            } } } });
        const result = session.login(); expect(session.snapshot()).toEqual({ status: 'pending' });
        f.requests[0]?.success({ code: 'synthetic-code' });
        expect((await result).status).toBe('active'); expect(proofs).toHaveLength(1);
        expect(JSON.stringify(session.snapshot())).not.toContain('synthetic-code');
    });
});
