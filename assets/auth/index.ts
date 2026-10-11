export { AuthSession } from "./authSession";
export { WechatCredentialAdapter } from "./wechatCredential";
export type { WechatLoginApi } from "./wechatCredential";
export { GoogleCredentialAdapter, AppleCredentialAdapter } from "./nativeCredential";
export type { NativeCredentialBridge, NativeCredentialOptions, NativeLoginProvider } from "./nativeCredential";
export { CocosNativeCredentialBridge } from "./nativeCredentialBridge";
export type { NativeLoginReflection } from "./nativeCredentialBridge";
export type {
  AuthClock, AuthSessionOptions, AuthSnapshot, CredentialPort, CredentialProof, CredentialScope, LoginResult,
  IdentityProvider, PlatformCredential, SessionExchangePort, SessionIdentity,
} from "./contracts";
