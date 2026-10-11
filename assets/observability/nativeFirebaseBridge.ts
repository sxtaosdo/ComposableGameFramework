import type { NativeFirebaseBridge } from './telemetryAdapters';
import { nativeParameters } from './platformTelemetry';

/** Inject native.reflection after sys.isNative / sys.os checks; importing this file never reads cc/jsb. */
export interface CocosNativeReflection { callStaticMethod(className: string, methodName: string, ...args: unknown[]): unknown }
export class CocosFirebaseAnalyticsBridge implements NativeFirebaseBridge {
    public constructor(private readonly reflection: CocosNativeReflection,
        private readonly platform: 'android' | 'ios') {}
    public isConfigured(): boolean {
        try {
            return (this.platform === 'android'
                ? this.reflection.callStaticMethod('com/shidai3/platform/Shidai3FirebaseAnalytics', 'isConfigured', '()Z')
                : this.reflection.callStaticMethod('Shidai3FirebaseAnalytics', 'isConfigured')) === true;
        } catch { return false; }
    }
    public submit(name: string, parameters: Readonly<Record<string, string | number>>): boolean {
        try {
            const safe = nativeParameters(name, parameters);
            if (!safe) return false;
            const json = JSON.stringify(safe);
            const result = this.platform === 'android'
                ? this.reflection.callStaticMethod('com/shidai3/platform/Shidai3FirebaseAnalytics', 'submit',
                    '(Ljava/lang/String;Ljava/lang/String;)Z', name, json)
                : this.reflection.callStaticMethod('Shidai3FirebaseAnalytics', 'submit:parameters:', name, json);
            return result === true; // undefined/void is not acceptance.
        } catch { return false; }
    }
}
