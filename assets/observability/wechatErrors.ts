import { TelemetryClient } from './telemetryClient';
export type WechatErrorHandler = (raw: unknown) => void;
export interface WechatErrorApi {
    onError(handler: WechatErrorHandler): void;
    offError(handler: WechatErrorHandler): void;
}

/** Explicit lifetime. Never inspect wx's raw error string or remove other owners' handlers. */
export class WechatErrorListener {
    private handler: WechatErrorHandler | undefined;
    private sequence = 0;
    public constructor(private readonly api: WechatErrorApi, private readonly client: TelemetryClient) {}
    public start(enabled = false): boolean {
        if (!enabled) return false;
        if (this.handler) return true;
        const handler: WechatErrorHandler = _raw => {
            if (this.handler !== handler) return;
            this.client.captureError(undefined, { code: 'js_uncaught', operation: 'gameplay',
                factId: `wx-error-${++this.sequence}` });
        };
        this.handler = handler;
        try { this.api.onError(handler); }
        catch {
            if (this.handler === handler) this.handler = undefined;
            this.remove(handler); return false;
        }
        // Registration may synchronously stop/restart us or retain the old callback after stop.
        if (this.handler !== handler) { this.remove(handler); return false; }
        return true;
    }
    public stop(): void {
        const handler = this.handler;
        if (!handler) return;
        this.handler = undefined;
        this.remove(handler);
    }
    private remove(handler: WechatErrorHandler): void {
        try { this.api.offError(handler); } catch { /* retained callbacks remain inert across restarts */ }
    }
}
