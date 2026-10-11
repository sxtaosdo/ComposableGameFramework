export { AuthSession } from "./authSession";
export { LoginFacade } from "./loginFacade";
export type { AuthLoginConfig, AuthReadiness, AuthReadinessStatus, LoginFacadeOptions, LoginFacadeSnapshot } from "./loginFacade";
export { WechatCredentialAdapter } from "./wechatCredential";
export type { WechatLoginApi } from "./wechatCredential";
export { DouyinCredentialAdapter } from "./douyinCredential";
export type { DouyinLoginApi } from "./douyinCredential";
export { GoogleCredentialAdapter, AppleCredentialAdapter } from "./nativeCredential";
export type { NativeCredentialBridge, NativeCredentialOptions, NativeLoginProvider } from "./nativeCredential";
export { CocosNativeCredentialBridge } from "./nativeCredentialBridge";
export type { NativeLoginReflection } from "./nativeCredentialBridge";
export type {
  AuthClock, AuthSessionOptions, AuthSnapshot, CredentialPort, CredentialProof, CredentialScope, LoginResult,
  IdentityProvider, PlatformCredential, SessionExchangePort, SessionIdentity,
} from "./contracts";
