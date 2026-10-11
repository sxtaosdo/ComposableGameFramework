import { TelemetryClient } from './telemetryClient';
export type WechatErrorHandler = (raw: unknown) => void;
export interface WechatErrorApi {
    onError(handler: WechatErrorHandler): void;
    offError(handler: WechatErrorHandler): void;
}

/** Explicit lifetime. Never inspect wx's raw error string or remove other owners' handlers. */
export class WechatErrorListener {
    private active = false;
    private sequence = 0;
    private readonly handler: WechatErrorHandler = _raw => {
        if (!this.active) return;
        this.client.captureError(undefined, { code: 'js_uncaught', operation: 'gameplay',
            factId: `wx-error-${++this.sequence}` });
    };
    public constructor(private readonly api: WechatErrorApi, private readonly client: TelemetryClient) {}
    public start(enabled = false): boolean {
        if (!enabled) return false;
        if (this.active) return true;
        this.active = true;
        try { this.api.onError(this.handler); return true; }
        catch { this.stop(); return false; }
    }
    public stop(): void {
        if (!this.active) return;
        this.active = false;
        try { this.api.offError(this.handler); } catch { /* retained callbacks remain inert */ }
    }
}
