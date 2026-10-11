import type { CredentialPort, CredentialScope, PlatformCredential } from './contracts';

/** Official minigame callback subset. No undocumented timeout or cancellable Task is assumed. */
export interface DouyinLoginApi {
    login(options: { force: boolean; success(result: unknown): void; fail(error: unknown): void }): unknown;
}

/** Unverified one-use code acquisition only; the existing session owns timeout and trusted exchange. */
export class DouyinCredentialAdapter implements CredentialPort {
    private readonly scope: Readonly<CredentialScope>;
    public constructor(private readonly api: DouyinLoginApi, scope: CredentialScope) {
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
                const login = this.api.login;
                if (settled || signal.aborted) { finish(); return; }
                login.call(this.api, { force: true,
                    success: result => {
                        if (settled || signal.aborted) { finish(); return; }
                        try {
                            if (typeof result !== 'object' || result === null) { finish(); return; }
                            const field = Object.getOwnPropertyDescriptor(result, 'code');
                            const code: unknown = field && 'value' in field ? field.value : undefined;
                            if (!this.code(code)) { finish(); return; }
                            const anonymous = Object.getOwnPropertyDescriptor(result, 'anonymousCode');
                            if (anonymous && !('value' in anonymous)) { finish(); return; }
                            const anonymousCode: unknown = anonymous?.value;
                            if (anonymousCode !== undefined && !this.code(anonymousCode)) { finish(); return; }
                            finish(Object.freeze({ provider: 'douyin', scope: this.scope,
                                proof: Object.freeze({ kind: 'douyin-code', code,
                                    ...(anonymousCode === undefined ? {} : { anonymousCode }) }) }));
                        } catch { finish(); }
                    },
                    fail: _error => finish(),
                });
            } catch { finish(); }
        });
    }

    private code(value: unknown): value is string {
        // Opaque platform strings, with the same bounded DTO/privacy checks as the existing WeChat adapter.
        return typeof value === 'string' && value.length > 0 && value.length <= 4096
            && value.trim() === value && !/[\u0000-\u001f\u007f]/.test(value);
    }
}
