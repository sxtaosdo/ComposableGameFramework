import type { AuthClock, CredentialPort, CredentialScope, PlatformCredential } from './contracts';

export type NativeLoginProvider = 'google' | 'apple';
/** Single-request native port. Nonce must come from an OS CSPRNG; poll atomically consumes terminal data. */
export interface NativeCredentialBridge {
    isConfigured(): boolean;
    nonce(): string;
    begin(requestId: string, nonce: string): boolean;
    poll(requestId: string): unknown | null;
    cancel(requestId: string): boolean;
}
export interface NativeCredentialOptions {
    enabled?: boolean;
    scope: CredentialScope;
    bridge?: NativeCredentialBridge;
    clock: AuthClock;
    timeoutMs?: number;
}
interface Attempt {
    readonly signal: AbortSignal;
    readonly reject: (error: Error) => void;
    readonly resolve: (credential: PlatformCredential) => void;
    abort: () => void;
    requestId: string;
    nonce: string;
    deadline: number;
    begun: boolean;
    timer?: unknown;
    hasTimer: boolean;
    epoch: number;
}
function own(input: unknown, key: string): unknown {
    if (!input || typeof input !== 'object') return undefined;
    const field = Object.getOwnPropertyDescriptor(input, key);
    return field && 'value' in field ? field.value : undefined;
}
function opaque(value: unknown, limit: number): value is string {
    return typeof value === 'string' && value.length > 0 && value.length <= limit
        && !/[\s\u0000-\u001f\u007f]/.test(value);
}
function random(value: unknown): value is string { return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value); }

/** Platform materials only. No token decoding, backend exchange, SDK cache or game identity inference. */
class NativeCredentialAdapter implements CredentialPort {
    private pending: Attempt | null = null;
    private enabled: boolean;
    private readonly timeout: number;
    private readonly scope: Readonly<CredentialScope>;
    public constructor(private readonly provider: NativeLoginProvider, private readonly options: NativeCredentialOptions) {
        this.enabled = options.enabled === true;
        this.timeout = options.timeoutMs === undefined ? 15000 : options.timeoutMs;
        if (!Number.isSafeInteger(this.timeout) || this.timeout < 1 || this.timeout > 60000) throw new Error('Invalid login timeout');
        const issuer = own(options.scope, 'issuer'), applicationId = own(options.scope, 'applicationId'), host = own(options.scope, 'host');
        if (!opaque(issuer, 256) || !opaque(applicationId, 256) || !opaque(host, 256)) throw new Error('Invalid credential scope');
        this.scope = Object.freeze({ issuer, applicationId, host });
    }
    public acquire(signal: AbortSignal): Promise<PlatformCredential> {
        return new Promise((resolve, reject) => {
            if (!this.enabled || !this.options.bridge || this.pending || signal.aborted) {
                reject(new Error('Platform credential unavailable')); return;
            }
            const attempt: Attempt = { signal, resolve, reject, abort: () => {}, requestId: '', nonce: '',
                deadline: 0, begun: false, hasTimer: false, epoch: 0 };
            attempt.abort = () => this.finish(attempt);
            this.pending = attempt;
            signal.addEventListener('abort', attempt.abort, { once: true });
            try {
                const ready = this.bridgeCall(attempt, 'isConfigured');
                if (!this.current(attempt)) return;
                if (ready !== true) { this.finish(attempt); return; }
                const start = this.time(attempt);
                if (!this.current(attempt)) return;
                attempt.deadline = start + this.timeout;
                if (!Number.isSafeInteger(attempt.deadline)) { this.finish(attempt); return; }
                const nonce = this.bridgeCall(attempt, 'nonce');
                if (!this.current(attempt)) return;
                const requestId = this.bridgeCall(attempt, 'nonce');
                if (!this.current(attempt)) return;
                if (!random(nonce) || !random(requestId) || nonce === requestId) { this.finish(attempt); return; }
                attempt.nonce = nonce; attempt.requestId = requestId;
                if (!this.inTime(attempt)) return;
                attempt.begun = true; // A synchronous begin callback must already be cancellable.
                const begun = this.bridgeCall(attempt, 'begin', requestId, nonce);
                if (!this.current(attempt)) return;
                if (begun !== true) { this.finish(attempt); return; }
                this.schedule(attempt);
            } catch { this.finish(attempt); }
        });
    }
    /** Host teardown only; does not sign out/disconnect the platform SDK or merge/save progress. */
    public dispose(): void { this.enabled = false; if (this.pending) this.finish(this.pending); }
    private current(attempt: Attempt): boolean { return this.pending === attempt && !attempt.signal.aborted; }
    private bridgeCall(attempt: Attempt, method: 'isConfigured' | 'nonce' | 'begin' | 'poll', ...args: string[]): unknown {
        const bridge = this.options.bridge!;
        const call = bridge[method];
        if (!this.current(attempt)) return undefined;
        return Reflect.apply(call, bridge, args);
    }
    private time(attempt: Attempt): number {
        const clock = this.options.clock, now = clock.now;
        if (!this.current(attempt)) return 0;
        const time = Reflect.apply(now, clock, []);
        if (!Number.isSafeInteger(time) || time < 0) throw new Error('Invalid login clock');
        return time;
    }
    private inTime(attempt: Attempt): boolean {
        const time = this.time(attempt);
        if (!this.current(attempt)) return false;
        if (time >= attempt.deadline) { this.finish(attempt); return false; }
        return true;
    }
    private schedule(attempt: Attempt): void {
        if (!this.current(attempt)) return;
        const epoch = ++attempt.epoch;
        let scheduling = true;
        const clock = this.options.clock, schedule = clock.schedule;
        if (!this.current(attempt)) return;
        const handle = Reflect.apply(schedule, clock, [() => {
            if (this.pending !== attempt || epoch !== attempt.epoch) return;
            attempt.hasTimer = false;
            if (scheduling) { this.finish(attempt); return; } // Never recursively poll a synchronous scheduler.
            this.poll(attempt);
        }, 50]);
        scheduling = false;
        if (this.current(attempt)) { attempt.timer = handle; attempt.hasTimer = true; }
        else { try { this.options.clock.cancel(handle); } catch { /* own cleanup only */ } }
    }
    private poll(attempt: Attempt): void {
        try {
            if (!this.inTime(attempt)) return;
            const result = this.bridgeCall(attempt, 'poll', attempt.requestId);
            if (!this.current(attempt)) return;
            if (result === null) { this.schedule(attempt); return; }
            const provider = own(result, 'provider'), requestId = own(result, 'requestId'), nonce = own(result, 'nonce');
            const status = own(result, 'status'), idToken = own(result, 'idToken');
            const authorizationCode = this.provider === 'apple' ? own(result, 'authorizationCode') : undefined;
            if (!this.current(attempt)) return;
            if (provider !== this.provider || requestId !== attempt.requestId || nonce !== attempt.nonce
                || status !== 'success' || !opaque(idToken, 16384)
                || (this.provider === 'apple' && !opaque(authorizationCode, 4096))) { this.finish(attempt); return; }
            if (!this.inTime(attempt)) return;
            const proof = this.provider === 'google' ? Object.freeze({ kind: 'google-id-token' as const, idToken, nonce: attempt.nonce })
                : Object.freeze({ kind: 'apple-id-token-code' as const, idToken, authorizationCode: authorizationCode as string, nonce: attempt.nonce });
            this.finish(attempt, Object.freeze({ provider: this.provider, scope: this.scope, proof }));
        } catch { this.finish(attempt); }
    }
    private finish(attempt: Attempt, credential?: PlatformCredential): void {
        if (this.pending !== attempt) return;
        this.pending = null; attempt.epoch++;
        attempt.signal.removeEventListener('abort', attempt.abort);
        if (attempt.hasTimer) {
            attempt.hasTimer = false;
            try { this.options.clock.cancel(attempt.timer); } catch { /* settled state cannot be revived */ }
        }
        if (attempt.begun) { try { this.options.bridge!.cancel(attempt.requestId); } catch { /* best effort */ } }
        attempt.nonce = ''; attempt.requestId = '';
        if (credential) attempt.resolve(credential);
        else attempt.reject(new Error('Platform credential unavailable'));
    }
}
export class GoogleCredentialAdapter extends NativeCredentialAdapter {
    public constructor(options: NativeCredentialOptions) { super('google', options); }
}
export class AppleCredentialAdapter extends NativeCredentialAdapter {
    public constructor(options: NativeCredentialOptions) { super('apple', options); }
}
