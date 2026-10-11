import type { NativeCredentialBridge, NativeLoginProvider } from './nativeCredential';
export interface NativeLoginReflection { callStaticMethod(className: string, methodName: string, ...args: unknown[]): unknown }

/** Fixed reflection transport only; import/construction never read cc/jsb or initialize SDKs. */
export class CocosNativeCredentialBridge implements NativeCredentialBridge {
    public constructor(private readonly reflection: NativeLoginReflection,
        private readonly provider: NativeLoginProvider, private readonly platform: 'android' | 'ios') {}
    private call(method: string, signature: string, ...args: string[]): unknown {
        if (this.platform === 'android' && this.provider === 'apple') return undefined;
        const name = this.provider === 'google' ? 'Shidai3GoogleCredential' : 'Shidai3AppleCredential';
        return this.platform === 'android'
            ? this.reflection.callStaticMethod('com/shidai3/platform/' + name, method, signature, ...args)
            : this.reflection.callStaticMethod(name, method, ...args);
    }
    public isConfigured(): boolean { try { return this.call('isConfigured', '()Z') === true; } catch { return false; } }
    public nonce(): string {
        try {
            const value = this.call('nonce', '()Ljava/lang/String;');
            return typeof value === 'string' ? value : '';
        } catch { throw new Error('Platform credential unavailable'); }
    }
    public begin(requestId: string, nonce: string): boolean {
        try { return this.call(this.platform === 'ios' ? 'begin:nonce:' : 'begin',
            '(Ljava/lang/String;Ljava/lang/String;)Z', requestId, nonce) === true; } catch { return false; }
    }
    public poll(requestId: string): unknown | null {
        try {
            const result = this.call(this.platform === 'ios' ? 'poll:' : 'poll', '(Ljava/lang/String;)Ljava/lang/String;', requestId);
            if (result === '') return null;
            if (typeof result !== 'string' || result.length > 24576) throw new Error();
            const dto: unknown = JSON.parse(result);
            if (!dto || typeof dto !== 'object' || Array.isArray(dto)) throw new Error();
            return dto;
        } catch { throw new Error('Platform credential unavailable'); }
    }
    public cancel(requestId: string): boolean {
        try { return this.call(this.platform === 'ios' ? 'cancel:' : 'cancel', '(Ljava/lang/String;)Z', requestId) === true; }
        catch { return false; }
    }
}
