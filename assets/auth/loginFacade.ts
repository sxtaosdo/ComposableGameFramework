import { AuthSession } from "./authSession";
import type { AuthClock, AuthSessionOptions, AuthSnapshot, CredentialPort, CredentialScope, IdentityProvider, LoginResult, SessionExchangePort } from "./contracts";

/** Public local configuration only; platformConfigured is a host assertion, not SDK verification. */
export interface AuthLoginConfig {
  readonly enabled?: boolean;
  readonly platformConfigured?: boolean;
  readonly provider?: IdentityProvider;
  readonly scope?: CredentialScope;
}
export type AuthReadinessStatus = "disabled" | "invalid-config" | "missing-platform-config"
  | "missing-exchange-port" | "missing-credential-port" | "ready" | "disposed";
export interface AuthReadiness { readonly status: AuthReadinessStatus; }
export interface LoginFacadeOptions {
  readonly clock: AuthClock;
  readonly timeoutMs?: number;
  readonly config?: AuthLoginConfig;
  readonly credential?: CredentialPort;
  readonly exchange?: SessionExchangePort;
}
export interface LoginFacadeSnapshot {
  readonly auth: AuthSnapshot;
  readonly readiness: AuthReadiness;
  readonly feedback: AuthSnapshot["status"] | LoginResult["status"];
  readonly canRequestLogin: boolean;
  readonly localPlayAvailable: true;
}
type CheckedConfig = { readonly status: "ready"; readonly provider: IdentityProvider; readonly scope: CredentialScope }
  | { readonly status: "disabled" | "invalid-config" | "missing-platform-config" };

/** Explicit login entry. Reuses AuthSession; never starts SDK/network work during construction or projection. */
export class LoginFacade {
  private readonly session: AuthSession;
  private readonly initialReadiness: AuthReadiness;
  private readonly disposedReadiness: AuthReadiness = Object.freeze({ status: "disposed" });
  private pending: Promise<LoginResult> | null = null;
  private epoch = 0;
  private closed = false;
  private lastResult: LoginResult["status"] | "guest" = "guest";

  constructor(options: LoginFacadeOptions) {
    const timeoutMs = options.timeoutMs === undefined ? 15000 : options.timeoutMs;
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000) throw new Error("Invalid login timeout");
    let status: AuthReadinessStatus = "invalid-config";
    let ports: AuthSessionOptions["ports"];
    try {
      const config = LoginFacade.configuration(LoginFacade.own(options, "config"));
      status = config.status;
      if (config.status === "ready") {
        const exchange = LoginFacade.own(options, "exchange");
        const exchangeMethod = LoginFacade.method<SessionExchangePort["exchange"]>(exchange, "exchange");
        if (!exchangeMethod) status = "missing-exchange-port";
        else {
          const credential = LoginFacade.own(options, "credential");
          const acquire = LoginFacade.method<CredentialPort["acquire"]>(credential, "acquire");
          if (!acquire) status = "missing-credential-port";
          else ports = Object.freeze({
            credential: Object.freeze({ acquire: (signal: AbortSignal) => acquire.call(credential, signal) }),
            exchange: Object.freeze({ exchange: (material, signal) => {
              // Local routing association is not proof verification; the injected trusted exchange still owns it.
              if (material.provider !== config.provider || material.scope.issuer !== config.scope.issuer
                || material.scope.applicationId !== config.scope.applicationId || material.scope.host !== config.scope.host) {
                return Promise.reject(new Error("Platform credential unavailable"));
              }
              return exchangeMethod.call(exchange, material, signal);
            } } satisfies SessionExchangePort),
          });
        }
      }
    } catch { status = "invalid-config"; ports = undefined; }
    this.initialReadiness = Object.freeze({ status });
    this.session = new AuthSession({ clock: options.clock, timeoutMs, ...(ports ? { ports } : {}) });
  }

  readiness(): AuthReadiness { return this.closed ? this.disposedReadiness : this.initialReadiness; }

  snapshot(): LoginFacadeSnapshot {
    const auth = this.session.snapshot(), readiness = this.readiness();
    const feedback = readiness.status !== "ready" ? "unavailable" : auth.status !== "guest" ? auth.status
      : this.lastResult === "active" || this.lastResult === "unavailable" ? "guest" : this.lastResult;
    return Object.freeze({ auth, readiness, feedback,
      canRequestLogin: readiness.status === "ready" && auth.status !== "pending" && auth.status !== "active",
      localPlayAvailable: true });
  }

  /** Only an explicit player action should call this. Concurrent clicks keep AuthSession's original Promise. */
  requestLogin(): Promise<LoginResult> {
    if (this.readiness().status !== "ready") return Promise.resolve(Object.freeze({ status: "unavailable" }));
    // Active expiry checks can call a host clock that disposes/logs out/retries this facade.
    const auth = this.session.snapshot();
    if (this.closed) return Promise.resolve(Object.freeze({ status: "unavailable" }));
    if (auth.status === "active") return Promise.resolve(auth);
    const entryEpoch = this.epoch;
    const promise = this.session.login();
    if (this.epoch === entryEpoch && this.pending !== promise) {
      const epoch = ++this.epoch;
      this.pending = promise;
      void promise.then(result => {
        if (this.epoch !== epoch || this.pending !== promise) return;
        this.pending = null;
        this.lastResult = result.status;
      });
    }
    return promise;
  }

  cancel(): void {
    if (this.session.snapshot().status !== "pending") return;
    this.epoch++; this.pending = null; this.lastResult = "cancelled";
    this.session.cancel();
  }

  logout(): void {
    this.epoch++; this.pending = null; this.lastResult = "guest";
    this.session.logout();
  }

  /** Invalidates local work; the product separately disposes any credential adapter/host it owns. */
  dispose(): void {
    if (this.closed) return;
    this.closed = true;
    this.logout();
  }

  private static configuration(input: unknown): CheckedConfig {
    if (input === undefined) return { status: "disabled" };
    if (!this.record(input, ["enabled", "platformConfigured", "provider", "scope"])) return { status: "invalid-config" };
    const enabled = this.own(input, "enabled"), configured = this.own(input, "platformConfigured");
    const provider = this.own(input, "provider"), scope = this.own(input, "scope");
    if ((enabled !== undefined && typeof enabled !== "boolean") || (configured !== undefined && typeof configured !== "boolean")
      || (provider !== undefined && provider !== "wechat" && provider !== "douyin" && provider !== "google" && provider !== "apple")
      || (scope !== undefined && !this.record(scope, ["issuer", "applicationId", "host"]))) return { status: "invalid-config" };
    if (enabled !== true) return { status: "disabled" };
    if (configured !== true || provider === undefined || scope === undefined) return { status: "missing-platform-config" };
    const issuer = this.own(scope, "issuer"), applicationId = this.own(scope, "applicationId"), host = this.own(scope, "host");
    if (!this.text(issuer) || !this.text(applicationId) || !this.text(host)) return { status: "missing-platform-config" };
    return { status: "ready", provider, scope: Object.freeze({ issuer, applicationId, host }) };
  }

  private static text(input: unknown): input is string {
    return typeof input === "string" && input.length > 0 && input.length <= 256 && !/[\s\u0000-\u001f\u007f]/.test(input);
  }
  private static record(input: unknown, allowed: readonly string[]): boolean {
    return typeof input === "object" && input !== null && Reflect.ownKeys(input).every(key => {
      const field = Object.getOwnPropertyDescriptor(input, key);
      return typeof key === "string" && allowed.indexOf(key) >= 0 && !!field && "value" in field;
    });
  }
  private static own(input: unknown, key: string): unknown {
    if (typeof input !== "object" || input === null) return undefined;
    const field = Object.getOwnPropertyDescriptor(input, key);
    return field && "value" in field ? field.value : undefined;
  }
  /** Service methods may live on a prototype; never execute a method getter or freeze its receiver. */
  private static method<T>(input: unknown, key: string): T | undefined {
    let cursor = input;
    const seen = new Set<unknown>();
    while (typeof cursor === "object" && cursor !== null && !seen.has(cursor) && seen.size < 16) {
      seen.add(cursor);
      const field = Object.getOwnPropertyDescriptor(cursor, key);
      if (field) return "value" in field && typeof field.value === "function" ? field.value as T : undefined;
      cursor = Object.getPrototypeOf(cursor);
    }
    return undefined;
  }
}
