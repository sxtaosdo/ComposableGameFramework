export type IdentityProvider = "wechat" | "douyin" | "google" | "apple";

/** Untrusted routing metadata. The exchange adapter must independently verify this scope. */
export interface CredentialScope {
  readonly issuer: string;
  readonly applicationId: string;
  readonly host: string;
}

/** Temporary platform proof. Only the exchange adapter receives its contents. */
export type CredentialProof =
  | { readonly kind: "wechat-code"; readonly code: string }
  | { readonly kind: "douyin-code"; readonly code: string; readonly anonymousCode?: string }
  | { readonly kind: "google-id-token"; readonly idToken: string; readonly nonce: string }
  | { readonly kind: "apple-id-token-code"; readonly idToken: string; readonly authorizationCode: string; readonly nonce: string };

export interface PlatformCredential {
  readonly provider: IdentityProvider;
  readonly scope: CredentialScope;
  readonly proof: CredentialProof;
}

export interface SessionIdentity {
  /** Stable game account mapped by the trusted backend, never inferred from profile/device data. */
  readonly gameAccountId: string;
  readonly sessionId: string;
  readonly expiresAtMs: number;
}

export interface CredentialPort {
  acquire(signal: AbortSignal): Promise<PlatformCredential>;
}

/** Owns proof, issuer/app/host verification, provider-subject mapping and any transport tokens. */
export interface SessionExchangePort {
  exchange(credential: PlatformCredential, signal: AbortSignal): Promise<SessionIdentity>;
}

export interface AuthClock {
  now(): number;
  schedule(callback: () => void, delayMs: number): unknown;
  cancel(handle: unknown): void;
}

export interface AuthSessionOptions {
  readonly clock: AuthClock;
  readonly timeoutMs: number;
  readonly ports?: { readonly credential: CredentialPort; readonly exchange: SessionExchangePort };
}

export type LoginResult =
  | { readonly status: "active"; readonly session: Readonly<SessionIdentity> }
  | { readonly status: "unavailable" | "cancelled" | "timeout" | "expired" | "failed" };

export type AuthSnapshot =
  | { readonly status: "guest" | "pending" | "expired" }
  | { readonly status: "active"; readonly session: Readonly<SessionIdentity> };
