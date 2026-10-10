export { TelemetryClient } from "./telemetryClient";
export { LocalRecordingAdapter, WechatTelemetryAdapter, DouyinTelemetryAdapter, NativeFirebaseTelemetryAdapter } from "./telemetryAdapters";
export { TelemetrySchema } from "./telemetrySchema";
export type { TrackResult, FlushResult, TelemetryOptions } from "./telemetryClient";
export type { TelemetryAdapter, TelemetryCapabilities, AdapterResult } from "./telemetryAdapters";
export type {
    TelemetryContext, TelemetryFields, TelemetryEventName, FactIdentity, DiagnosticCode, ErrorDetails, Scalar, TelemetryRecord,
} from "./telemetrySchema";
