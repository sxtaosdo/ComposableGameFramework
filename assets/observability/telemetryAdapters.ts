import type { TelemetryRecord } from './telemetrySchema';
import { platformBatch, PlatformSubmissionLedger } from './platformTelemetry';

export interface TelemetryCapabilities {
    provider: 'local' | 'wechat' | 'douyin' | 'native-firebase';
    configured: boolean;
    externalDelivery: boolean;
    rawErrorCapture: boolean;
    nativeCrashCapture: boolean;
}
export type AdapterResult = 'recorded_locally' | 'submitted_to_sdk' | 'not_configured' | 'retry';
/** Synchronous, bounded acceptance only. Never wait for a network ACK in a gameplay command. */
export interface TelemetryAdapter {
    readonly capabilities: Readonly<TelemetryCapabilities>;
    accept(records: readonly TelemetryRecord[]): AdapterResult;
}

export class LocalRecordingAdapter implements TelemetryAdapter {
    public readonly capabilities = Object.freeze({ provider: 'local' as const, configured: true,
        externalDelivery: false, rawErrorCapture: false, nativeCrashCapture: false });
    private readonly records: TelemetryRecord[] = [];

    public accept(records: readonly TelemetryRecord[]): AdapterResult {
        // A caller may retry after an uncertain result. Deduplicate within the bounded local retention window.
        for (const record of records) {
            if (this.records.some(existing => existing.eventId === record.eventId)) continue;
            this.records.push(record);
            if (this.records.length > 200) this.records.shift();
        }
        return 'recorded_locally';
    }

    public snapshot(): readonly TelemetryRecord[] { return Object.freeze(this.records.slice()); }
    public clear(): void { this.records.length = 0; }
}

export interface WechatReportApi { reportEvent(name: string, parameters: Readonly<Record<string, string | number>>): void }
export interface WechatTelemetryOptions {
    enabled?: boolean; api?: WechatReportApi; now?: () => number;
    /** Explicit attestation of event names registered in the platform console; never inferred from wx availability. */
    configuredEvents?: readonly string[];
}

/** Explicit opt-in wx.reportEvent calling layer; void acceptance is never a remote ACK. */
export class WechatTelemetryAdapter implements TelemetryAdapter {
    public readonly capabilities: Readonly<TelemetryCapabilities>;
    private readonly ledger: PlatformSubmissionLedger;
    private readonly configuredEvents: ReadonlySet<string>;
    public constructor(private readonly options: WechatTelemetryOptions = {}) {
        this.configuredEvents = new Set(options.configuredEvents || []);
        const configured = options.enabled === true && !!options.api && this.configuredEvents.size > 0;
        this.capabilities = Object.freeze({ provider: 'wechat', configured, externalDelivery: configured,
            rawErrorCapture: false, nativeCrashCapture: false });
        this.ledger = new PlatformSubmissionLedger(options.now);
    }
    public accept(records: readonly TelemetryRecord[]): AdapterResult {
        if (!this.capabilities.configured || !this.options.api) return 'not_configured';
        try {
            if (typeof this.options.api.reportEvent !== 'function') return 'not_configured';
            const events = platformBatch(records, 'wechat');
            if (!events) return 'retry';
            if (events.some(event => !this.configuredEvents.has(event.name))) return 'not_configured';
            return this.ledger.submit(events, event => {
                this.options.api!.reportEvent(event.name, event.parameters); return true;
            }) ? 'submitted_to_sdk' : 'retry';
        } catch { return 'retry'; }
    }
}

/** Contract only: no tt calls, credentials, SDK imports or automatic provider selection. */
export class DouyinTelemetryAdapter implements TelemetryAdapter {
    public readonly capabilities = Object.freeze({ provider: 'douyin' as const, configured: false,
        externalDelivery: false, rawErrorCapture: false, nativeCrashCapture: false });
    public accept(_records: readonly TelemetryRecord[]): AdapterResult { return 'not_configured'; }
}

/** Real native bridge accepts an official SDK submission locally; it must return false when unconfigured. */
export interface NativeFirebaseBridge {
    isConfigured(): boolean;
    submit(name: string, parameters: Readonly<Record<string, string | number>>): boolean;
}
export interface NativeFirebaseTelemetryOptions { enabled?: boolean; bridge?: NativeFirebaseBridge; now?: () => number }

/** Analytics-only path. Crashlytics automatic raw capture needs a separate explicit build/policy gate. */
export class NativeFirebaseTelemetryAdapter implements TelemetryAdapter {
    private readonly ledger: PlatformSubmissionLedger;
    public constructor(private readonly options: NativeFirebaseTelemetryOptions = {}) {
        this.ledger = new PlatformSubmissionLedger(options.now);
    }
    public get capabilities(): Readonly<TelemetryCapabilities> {
        let configured = false;
        try { configured = this.options.enabled === true && this.options.bridge?.isConfigured() === true; } catch { /* fail closed */ }
        return Object.freeze({ provider: 'native-firebase', configured, externalDelivery: configured,
            rawErrorCapture: false, nativeCrashCapture: false });
    }
    public accept(records: readonly TelemetryRecord[]): AdapterResult {
        if (!this.capabilities.configured || !this.options.bridge) return 'not_configured';
        try {
            const events = platformBatch(records, 'native');
            if (!events) return 'retry';
            return this.ledger.submit(events, event => this.options.bridge!.submit(event.name, event.parameters) === true)
                ? 'submitted_to_sdk' : 'retry';
        } catch { return 'retry'; }
    }
}
