import type { AdapterResult, TelemetryAdapter, TelemetryCapabilities } from './telemetryAdapters';
import type { TelemetryRecord, ErrorDetails } from './telemetrySchema';
import { TelemetrySchema } from './telemetrySchema';
import { platformBatch, PlatformSubmissionLedger } from './platformTelemetry';
import type { CocosNativeReflection } from './nativeFirebaseBridge';

export interface NativeCrashlyticsBridge {
    isConfigured(): boolean;
    record(code: string, operation: string): boolean;
    disable(): boolean;
}
export interface NativeCrashlyticsOptions {
    enabled?: boolean;
    /** Host attests the separately approved SDK build can automatically retain raw crashes/stacks. */
    automaticCaptureEnabledInBuild?: boolean;
    bridge?: NativeCrashlyticsBridge;
    now?: () => number;
}

/** Error-only client; no SDK initialization, listeners, timers or raw cause access. */
export class NativeFirebaseCrashlyticsAdapter implements TelemetryAdapter {
    private active: boolean;
    private readonly ledger: PlatformSubmissionLedger;
    private readonly automaticCaptureEnabledInBuild: boolean;
    private readonly bridge: NativeCrashlyticsBridge | undefined;
    public constructor(options: NativeCrashlyticsOptions = {}) {
        this.automaticCaptureEnabledInBuild = options.automaticCaptureEnabledInBuild === true;
        this.active = options.enabled === true && this.automaticCaptureEnabledInBuild;
        this.bridge = this.active ? options.bridge : undefined;
        this.ledger = new PlatformSubmissionLedger(options.now);
    }
    public get capabilities(): Readonly<TelemetryCapabilities> {
        const raw = this.automaticCaptureEnabledInBuild;
        let configured = false;
        try {
            const ready = this.active && this.bridge?.isConfigured() === true;
            configured = this.active && ready; // A host callback may synchronously stop this adapter.
        } catch { /* fail closed */ }
        // Stop cannot uninstall native handlers or prove immediate cessation of SDK collection.
        return Object.freeze({ provider: 'native-firebase', configured, externalDelivery: configured,
            rawErrorCapture: raw, nativeCrashCapture: raw });
    }
    public accept(records: readonly TelemetryRecord[]): AdapterResult {
        if (!this.capabilities.configured || !this.bridge) return 'not_configured';
        try {
            const events = platformBatch(records, 'native');
            if (!events || events.some(event => event.name !== 'diagnostic_error')) return 'retry';
            const bridge = this.bridge;
            return this.ledger.submit(events, event => {
                const record = bridge.record;
                return this.active && record.call(bridge,
                    String(event.parameters.code), String(event.parameters.operation)) === true;
            })
                ? 'submitted_to_sdk' : 'retry';
        } catch { return 'retry'; }
    }
    /** Stops this adapter immediately. SDK false override is only a request, never a capture/upload ACK. */
    public stop(): 'disabled_locally' | 'sdk_disable_requested' | 'sdk_disable_failed' {
        const wasActive = this.active; this.active = false;
        if (!wasActive || !this.bridge) return 'disabled_locally';
        try { return this.bridge.disable() === true ? 'sdk_disable_requested' : 'sdk_disable_failed'; }
        catch { return 'sdk_disable_failed'; }
    }
}

/** Fixed native entry; sends only two finite enums, never serializes a caller's raw object. */
export class CocosFirebaseCrashlyticsBridge implements NativeCrashlyticsBridge {
    public constructor(private readonly reflection: CocosNativeReflection, private readonly platform: 'android' | 'ios') {}
    private booleanCall(method: string, signature: string, ...args: unknown[]): boolean {
        try {
            return (this.platform === 'android'
                ? this.reflection.callStaticMethod('com/shidai3/platform/Shidai3FirebaseCrashlytics', method, signature, ...args)
                : this.reflection.callStaticMethod('Shidai3FirebaseCrashlytics', method, ...args)) === true;
        } catch { return false; }
    }
    public isConfigured(): boolean { return this.booleanCall('isConfigured', '()Z'); }
    public record(code: string, operation: string): boolean {
        try {
            const safe = TelemetrySchema.error({ code, operation } as ErrorDetails);
            if (!safe) return false;
            return this.booleanCall(this.platform === 'android' ? 'record' : 'record:',
                '(Ljava/lang/String;)Z', JSON.stringify(safe));
        } catch { return false; }
    }
    public disable(): boolean { return this.booleanCall('disable', '()Z'); }
}
