import type { AuthSessionOptions, AuthSnapshot, CredentialProof, IdentityProvider, LoginResult, PlatformCredential, SessionIdentity } from "./contracts";

interface LoginAttempt {
  readonly abort: AbortController;
  readonly promise: Promise<LoginResult>;
  readonly resolve: (result: LoginResult) => void;
  deadlineMs: number;
  timer?: unknown;
  hasTimer?: boolean;
}

/** Memory-only session lifecycle. No SDK, storage, network, listeners or implicit login. */
export class AuthSession {
  private state: AuthSnapshot = Object.freeze({ status: "guest" });
  private pending: LoginAttempt | null = null;

  constructor(private readonly options: AuthSessionOptions) {
    if (!Number.isSafeInteger(options.timeoutMs) || options.timeoutMs <= 0) {
      throw new Error("Invalid login timeout");
    }
  }

  snapshot(): AuthSnapshot {
    const state = this.state;
    if (state.status === "active") {
      try {
        const now = this.time();
        if (this.state === state && state.session.expiresAtMs <= now) this.state = Object.freeze({ status: "expired" });
      } catch { if (this.state === state) this.state = Object.freeze({ status: "guest" }); }
    }
    return this.state;
  }

  /** Concurrent callers share the same attempt, including its cancellation and timeout. */
  login(): Promise<LoginResult> {
    if (this.pending) return this.pending.promise;
    const snapshot = this.snapshot();
    // snapshot may invoke a clock callback that starts a new attempt.
    const pendingAfterSnapshot = this.pending as LoginAttempt | null;
    if (pendingAfterSnapshot) return pendingAfterSnapshot.promise;
    if (snapshot.status === "active") return Promise.resolve(snapshot);
    if (!this.options.ports) return Promise.resolve({ status: "unavailable" });
    let resolve: (result: LoginResult) => void = () => undefined;
    const promise = new Promise<LoginResult>((done) => { resolve = done; });
    const attempt: LoginAttempt = { abort: new AbortController(), promise, resolve, deadlineMs: 0 };
    this.pending = attempt;
    this.state = Object.freeze({ status: "pending" });
    try {
      attempt.deadlineMs = this.time() + this.options.timeoutMs;
      if (!Number.isSafeInteger(attempt.deadlineMs)) throw new Error("Invalid login deadline");
      attempt.timer = this.options.clock.schedule(() => this.finish(attempt, { status: "timeout" }), this.options.timeoutMs);
      attempt.hasTimer = true;
      // A scheduler may run synchronously; never start work for an already completed attempt.
      if (this.pending === attempt) void this.exchange(attempt);
      else this.cancelTimer(attempt);
    } catch { this.finish(attempt, { status: "failed" }); }
    return promise;
  }

  cancel(): void {
    if (this.pending) this.finish(this.pending, { status: "cancelled" });
  }

  /** Also serves as product teardown. Adapters own any remote logout or token disposal. */
  logout(): void {
    this.state = Object.freeze({ status: "guest" });
    this.cancel();
  }

  private async exchange(attempt: LoginAttempt): Promise<void> {
    const ports = this.options.ports;
    if (!ports) return;
    try {
      const credential = await ports.credential.acquire(attempt.abort.signal);
      if (this.pending !== attempt) return;
      if (this.time() >= attempt.deadlineMs) { this.finish(attempt, { status: "timeout" }); return; }
      const provider = this.value(credential, "provider");
      if (provider !== "wechat" && provider !== "douyin" && provider !== "google" && provider !== "apple") {
        this.finish(attempt, { status: "failed" });
        return;
      }
      const proof = this.proof(provider, this.value(credential, "proof"));
      const scope = this.value(credential, "scope");
      const issuer = this.value(scope, "issuer"), applicationId = this.value(scope, "applicationId"), host = this.value(scope, "host");
      if (!proof || !this.text(issuer) || !this.text(applicationId) || !this.text(host)
        || issuer.length > 256 || applicationId.length > 256 || host.length > 256) {
        this.finish(attempt, { status: "failed" }); return;
      }
      const safeCredential: PlatformCredential = Object.freeze({ provider, proof,
        scope: Object.freeze({ issuer, applicationId, host }) });
      if (this.time() >= attempt.deadlineMs) { this.finish(attempt, { status: "timeout" }); return; }
      if (this.pending !== attempt) return;
      const grant = await ports.exchange.exchange(safeCredential, attempt.abort.signal);
      if (this.pending !== attempt) return;
      const session = this.identity(grant);
      const now = this.time();
      if (now >= attempt.deadlineMs) this.finish(attempt, { status: "timeout" });
      else if (!session) this.finish(attempt, { status: "failed" });
      else if (session.expiresAtMs <= now) this.finish(attempt, { status: "expired" });
      else this.finish(attempt, { status: "active", session });
    } catch {
      if (this.pending !== attempt) return;
      let status: "timeout" | "failed" = "failed";
      try { if (this.time() >= attempt.deadlineMs) status = "timeout"; } catch { /* Clock failure remains failed. */ }
      this.finish(attempt, { status });
    }
  }

  private finish(attempt: LoginAttempt, result: LoginResult): void {
    if (this.pending !== attempt) return;
    this.pending = null;
    this.state = result.status === "active" ? Object.freeze(result)
      : Object.freeze({ status: result.status === "expired" ? "expired" : "guest" });
    this.cancelTimer(attempt);
    if (result.status !== "active") attempt.abort.abort();
    attempt.resolve(Object.freeze(result));
  }

  private cancelTimer(attempt: LoginAttempt): void {
    if (!attempt.hasTimer) return;
    attempt.hasTimer = false;
    try { this.options.clock.cancel(attempt.timer); } catch { /* Cleanup cannot change the settled outcome. */ }
  }

  private time(): number {
    const now = this.options.clock.now();
    if (!Number.isSafeInteger(now) || now < 0) throw new Error("Invalid auth clock");
    return now;
  }

  /** Only own data fields cross the DTO boundary; never execute adapter accessors. */
  private value(input: unknown, key: string): unknown {
    if (typeof input !== "object" || input === null) return undefined;
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    return descriptor && "value" in descriptor ? descriptor.value : undefined;
  }

  private text(value: unknown): value is string {
    return typeof value === "string" && value.length > 0;
  }

  private proof(provider: IdentityProvider, proof: unknown): CredentialProof | null {
    const kind = this.value(proof, "kind");
    if (provider === "wechat" && kind === "wechat-code") {
      const code = this.value(proof, "code");
      return this.text(code) ? Object.freeze({ kind: "wechat-code", code }) : null;
    }
    if (provider === "douyin" && kind === "douyin-code") {
      const code = this.value(proof, "code"), anonymousCode = this.value(proof, "anonymousCode");
      if (!this.text(code) || (anonymousCode !== undefined && !this.text(anonymousCode))) return null;
      return Object.freeze({ kind: "douyin-code", code, ...(anonymousCode === undefined ? {} : { anonymousCode }) });
    }
    if (provider === "google" && kind === "google-id-token") {
      const idToken = this.value(proof, "idToken"), nonce = this.value(proof, "nonce");
      return this.text(idToken) && this.text(nonce) ? Object.freeze({ kind: "google-id-token", idToken, nonce }) : null;
    }
    if (provider === "apple" && kind === "apple-id-token-code") {
      const idToken = this.value(proof, "idToken"), authorizationCode = this.value(proof, "authorizationCode"), nonce = this.value(proof, "nonce");
      return this.text(idToken) && this.text(authorizationCode) && this.text(nonce)
        ? Object.freeze({ kind: "apple-id-token-code", idToken, authorizationCode, nonce }) : null;
    }
    return null;
  }

  private identity(grant: unknown): Readonly<SessionIdentity> | null {
    const gameAccountId = this.value(grant, "gameAccountId"), sessionId = this.value(grant, "sessionId"), expiresAtMs = this.value(grant, "expiresAtMs");
    if (typeof gameAccountId !== "string" || !gameAccountId || gameAccountId.length > 128
      || typeof sessionId !== "string" || !sessionId || sessionId.length > 128
      || typeof expiresAtMs !== "number" || !Number.isSafeInteger(expiresAtMs) || expiresAtMs < 0) return null;
    return Object.freeze({ gameAccountId, sessionId, expiresAtMs });
  }
}
