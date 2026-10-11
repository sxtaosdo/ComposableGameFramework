import type { CredentialPort, CredentialScope, PlatformCredential } from './contracts';

/** Structural subset of the official minigame wx API; the host is explicitly injected. */
export interface WechatLoginApi {
    login(options: { timeout: number; success(result: { code: string }): void; fail(error: unknown): void }): unknown;
}

/** Acquires an unverified, one-use code. It never creates a game identity or exchanges AppSecret. */
export class WechatCredentialAdapter implements CredentialPort {
    private readonly scope: Readonly<CredentialScope>;
    public constructor(private readonly api: WechatLoginApi, scope: CredentialScope,
        private readonly timeoutMs = 10000) {
        if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 60000) throw new Error('Invalid login timeout');
        this.scope = Object.freeze({ issuer: scope.issuer, applicationId: scope.applicationId, host: scope.host });
    }

    public acquire(signal: AbortSignal): Promise<PlatformCredential> {
        return new Promise((resolve, reject) => {
            let settled = false;
            const finish = (credential?: PlatformCredential) => {
                if (settled) return;
                settled = true;
                signal.removeEventListener('abort', abort);
                if (credential) resolve(credential);
                else reject(new Error('Platform credential unavailable'));
            };
            const abort = () => finish();
            if (signal.aborted) { finish(); return; }
            signal.addEventListener('abort', abort, { once: true });
            try {
                this.api.login({ timeout: this.timeoutMs,
                    success: result => {
                        if (settled || signal.aborted) { finish(); return; }
                        try {
                            const field = Object.getOwnPropertyDescriptor(result, 'code');
                            const code: unknown = field && 'value' in field ? field.value : undefined;
                            // Official API specifies an opaque string, not an application-defined alphabet.
                            if (typeof code !== 'string' || code.length === 0 || code.length > 4096
                                || code.trim() !== code || /[\u0000-\u001f\u007f]/.test(code)) { finish(); return; }
                            finish(Object.freeze({ provider: 'wechat', scope: this.scope,
                                proof: Object.freeze({ kind: 'wechat-code', code }) }));
                        } catch { finish(); }
                    },
                    fail: _error => finish(),
                });
            } catch { finish(); }
        });
    }
}
