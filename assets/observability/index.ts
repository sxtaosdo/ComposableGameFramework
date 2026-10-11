export { TelemetryClient } from "./telemetryClient";
export { LocalRecordingAdapter, WechatTelemetryAdapter, DouyinTelemetryAdapter, NativeFirebaseTelemetryAdapter } from "./telemetryAdapters";
export { TelemetrySchema } from "./telemetrySchema";
export type { TrackResult, FlushResult, TelemetryOptions } from "./telemetryClient";
export type { TelemetryAdapter, TelemetryCapabilities, AdapterResult, WechatReportApi, WechatTelemetryOptions,
    NativeFirebaseBridge, NativeFirebaseTelemetryOptions } from "./telemetryAdapters";
export { WechatErrorListener } from "./wechatErrors";
export type { WechatErrorApi, WechatErrorHandler } from "./wechatErrors";
export { CocosFirebaseAnalyticsBridge } from "./nativeFirebaseBridge";
export type { CocosNativeReflection } from "./nativeFirebaseBridge";
export { NativeFirebaseCrashlyticsAdapter, CocosFirebaseCrashlyticsBridge } from "./nativeCrashlytics";
export type { NativeCrashlyticsBridge, NativeCrashlyticsOptions } from "./nativeCrashlytics";
export type {
    TelemetryContext, TelemetryFields, TelemetryEventName, FactIdentity, DiagnosticCode, ErrorDetails, Scalar, TelemetryRecord,
} from "./telemetrySchema";
