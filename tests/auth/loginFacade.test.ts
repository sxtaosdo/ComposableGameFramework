import { describe, expect, it } from "vitest";
import { LoginFacade, type AuthClock, type AuthLoginConfig, type CredentialPort, type LoginFacadeOptions,
  type PlatformCredential, type SessionExchangePort, type SessionIdentity } from "../../assets/auth/index";

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function fixture() {
  let now = 1000, clockCalls = 0;
  const callbacks: (() => void)[] = [], timers = new Set<unknown>();
  const credentials: ReturnType<typeof deferred<PlatformCredential>>[] = [];
  const exchanges: ReturnType<typeof deferred<SessionIdentity>>[] = [];
  const signals: AbortSignal[] = [], materials: PlatformCredential[] = [];
  const scope = { issuer: "fixture-issuer", applicationId: "fixture-app", host: "fixture-host" };
  const config = { enabled: true, platformConfigured: true, provider: "wechat" as const, scope };
  const material: PlatformCredential = { provider: "wechat", scope, proof: { kind: "wechat-code", code: "unverified-fixture-code" } };
  const grant = { gameAccountId: "fixture-game-account", sessionId: "fixture-session", expiresAtMs: 2000 };
  const clock: AuthClock = {
    now() { clockCalls++; return now; },
    schedule(callback) { clockCalls++; callbacks.push(callback); timers.add(callback); return callback; },
    cancel(handle) { clockCalls++; timers.delete(handle); },
  };
  class Credential implements CredentialPort {
    calls = 0;
    acquire(signal: AbortSignal) {
      this.calls++; signals.push(signal);
      const d = deferred<PlatformCredential>(); credentials.push(d); return d.promise;
    }
  }
  class Exchange implements SessionExchangePort {
    calls = 0;
    exchange(value: PlatformCredential, signal: AbortSignal) {
      this.calls++; materials.push(value); signals.push(signal);
      const d = deferred<SessionIdentity>(); exchanges.push(d); return d.promise;
    }
  }
  const credential = new Credential(), exchange = new Exchange();
  const options: LoginFacadeOptions = { clock, timeoutMs: 100, config, credential, exchange };
  const facade = new LoginFacade(options);
  return { facade, options, config, scope, clock, credential, exchange, credentials, exchanges, signals, callbacks, timers, materials, material, grant,
    clockCalls: () => clockCalls, setTime: (time: number) => { now = time; },
    async acquire(index = 0, value = material) { credentials[index]?.resolve(value); await Promise.resolve(); },
    async activate() { const result = facade.requestLogin(); await this.acquire(); exchanges[0]?.resolve(grant); return result; },
  };
}

describe("LoginFacade: local readiness and explicit offline-tested login", () => {
  it("constructs and projects complete local readiness without SDK, clock or authentication work", () => {
    const f = fixture();
    expect(f.facade.readiness()).toEqual({ status: "ready" });
    expect(f.facade.snapshot()).toEqual({ auth: { status: "guest" }, readiness: { status: "ready" },
      feedback: "guest", canRequestLogin: true, localPlayAvailable: true });
    expect(f.credential.calls + f.exchange.calls + f.clockCalls()).toBe(0);
    expect("login" in f.facade).toBe(false);
  });

  it.each([
    [undefined, "disabled"],
    [{}, "disabled"],
    [{ enabled: false }, "disabled"],
    [{ enabled: true }, "missing-platform-config"],
    [{ enabled: true, platformConfigured: false }, "missing-platform-config"],
    [{ enabled: true, platformConfigured: true, provider: "wechat", scope: { issuer: "", applicationId: "app", host: "host" } }, "missing-platform-config"],
  ] as const)("keeps guest with stable unavailable feedback for configuration %j", async (config, status) => {
    const f = fixture(), facade = new LoginFacade({ ...f.options, config });
    expect(facade.readiness()).toEqual({ status });
    expect(await facade.requestLogin()).toEqual({ status: "unavailable" });
    expect(await facade.requestLogin()).toEqual({ status: "unavailable" });
    expect(facade.snapshot()).toMatchObject({ auth: { status: "guest" }, feedback: "unavailable", canRequestLogin: false, localPlayAvailable: true });
    expect(f.credential.calls + f.exchange.calls + f.clockCalls()).toBe(0);
  });

  it("does not even inspect the credential method when trusted exchange is absent", async () => {
    const f = fixture();
    let accesses = 0;
    const credential = Object.defineProperty({ acquire: () => Promise.reject(new Error("unused")) }, "acquire",
      { get() { accesses++; throw new Error("must-not-probe-sdk"); } });
    const facade = new LoginFacade({ ...f.options, credential, exchange: undefined });
    expect(facade.readiness().status).toBe("missing-exchange-port");
    expect(await facade.requestLogin()).toEqual({ status: "unavailable" });
    expect(facade.snapshot().auth.status).toBe("guest");
    expect(accesses + f.exchange.calls).toBe(0);
  });

  it("reports a missing credential without invoking exchange", async () => {
    const f = fixture(), facade = new LoginFacade({ ...f.options, credential: undefined });
    expect(facade.readiness().status).toBe("missing-credential-port");
    expect(await facade.requestLogin()).toEqual({ status: "unavailable" });
    expect(f.exchange.calls).toBe(0);
  });

  it("rejects unknown public fields and accessors without reading their secret values", async () => {
    const f = fixture(); let accessed = 0;
    const configs = [
      Object.defineProperty({ ...f.config }, "appSecret", { get() { accessed++; return "secret-not-read"; } }),
      Object.defineProperty({ ...f.config }, "enabled", { get() { accessed++; return true; } }),
      { ...f.config, scope: Object.defineProperty({ ...f.scope }, "privateKey", { get() { accessed++; return "secret-not-read"; } }) },
      { ...f.config, [Symbol("secret")]: "secret-not-read" },
      { ...f.config, enabled: "true" },
      { ...f.config, provider: "unknown" },
    ];
    for (const config of configs) {
      const facade = new LoginFacade({ ...f.options, config: config as AuthLoginConfig });
      expect(facade.readiness().status).toBe("invalid-config");
      expect(await facade.requestLogin()).toEqual({ status: "unavailable" });
      expect(JSON.stringify(facade.snapshot())).not.toContain("secret-not-read");
    }
    expect(accessed + f.credential.calls + f.exchange.calls).toBe(0);
  });

  it("treats throwing configuration and service traps as invalid without leaking error text", () => {
    const f = fixture();
    for (const options of [
      { ...f.options, config: new Proxy(f.config, { ownKeys() { throw new Error("private-config-error"); } }) },
      { ...f.options, exchange: new Proxy(f.exchange, { getPrototypeOf() { throw new Error("private-port-error"); } }) },
    ]) {
      const facade = new LoginFacade(options);
      expect(facade.readiness().status).toBe("invalid-config");
      expect(JSON.stringify(facade.snapshot())).not.toContain("private-");
    }
  });

  it("captures config and prototype service methods without freezing their receivers", async () => {
    const f = fixture();
    f.config.enabled = false; f.config.platformConfigured = false; f.scope.applicationId = "changed-after-construction";
    f.credential.acquire = () => { throw new Error("method-replaced-after-construction"); };
    const result = f.facade.requestLogin();
    await f.acquire(0, { ...f.material, scope: { issuer: "fixture-issuer", applicationId: "fixture-app", host: "fixture-host" } });
    f.exchanges[0]?.resolve(f.grant);
    expect((await result).status).toBe("active");
    expect(f.credential.calls).toBe(1); expect(f.exchange.calls).toBe(1);
    expect(Object.isFrozen(f.credential) || Object.isFrozen(f.exchange)).toBe(false);
  });

  it("shares the original attempt across repeated clicks in both stages and waits for trusted exchange", async () => {
    const f = fixture(), result = f.facade.requestLogin();
    expect(f.facade.requestLogin()).toBe(result);
    expect(f.facade.snapshot()).toMatchObject({ auth: { status: "pending" }, feedback: "pending", canRequestLogin: false, localPlayAvailable: true });
    await f.acquire();
    expect(f.facade.requestLogin()).toBe(result);
    expect(f.facade.snapshot().auth.status).toBe("pending");
    expect(f.credential.calls).toBe(1); expect(f.exchange.calls).toBe(1);
    f.exchanges[0]?.resolve({ ...f.grant, ...{ bearerToken: "must-not-project" } });
    expect(await result).toEqual({ status: "active", session: f.grant });
    const snapshot = f.facade.snapshot();
    expect(snapshot).toMatchObject({ feedback: "active", canRequestLogin: false, localPlayAvailable: true });
    expect(JSON.stringify(snapshot)).not.toMatch(/unverified-fixture-code|bearerToken|must-not-project/);
    expect(Object.isFrozen(snapshot) && Object.isFrozen(snapshot.auth) && Object.isFrozen(snapshot.readiness)).toBe(true);
    f.facade.cancel(); expect(f.facade.snapshot().feedback).toBe("active");
  });

  it.each(["provider", "issuer", "applicationId", "host"] as const)("rejects mismatched %s before trusted exchange", async key => {
    const f = fixture(), result = f.facade.requestLogin();
    const material: PlatformCredential = key === "provider"
      ? { ...f.material, provider: "google", proof: { kind: "google-id-token", idToken: "unverified-token", nonce: "fixture-nonce" } }
      : { ...f.material, scope: { ...f.scope, [key]: "wrong-route" } };
    await f.acquire(0, material);
    expect(await result).toEqual({ status: "failed" });
    expect(f.exchange.calls).toBe(0);
    expect(f.facade.snapshot()).toMatchObject({ auth: { status: "guest" }, feedback: "failed", localPlayAvailable: true });
  });

  for (const stage of ["credential", "exchange"] as const) {
    for (const action of ["cancel", "logout", "dispose", "timeout"] as const) {
      it(`${action} at ${stage} keeps offline play and ignores late callbacks`, async () => {
        const f = fixture(), old = f.facade.requestLogin();
        if (stage === "exchange") await f.acquire();
        if (action === "timeout") { f.setTime(1100); f.callbacks[0]?.(); }
        else f.facade[action]();
        expect(await old).toEqual({ status: action === "timeout" ? "timeout" : "cancelled" });
        expect(f.facade.snapshot()).toMatchObject({ auth: { status: "guest" },
          feedback: action === "logout" ? "guest" : action === "dispose" ? "unavailable" : action === "timeout" ? "timeout" : "cancelled",
          localPlayAvailable: true });
        if (stage === "credential") await f.acquire();
        else { f.exchanges[0]?.resolve(f.grant); await Promise.resolve(); }
        expect(f.facade.snapshot().auth.status).toBe("guest");
        expect(f.exchange.calls).toBe(stage === "exchange" ? 1 : 0);
        expect(f.timers.size).toBe(0); expect(f.signals.every(signal => signal.aborted)).toBe(true);
        if (action === "dispose") {
          f.facade.dispose(); expect(f.facade.readiness().status).toBe("disposed");
          expect(await f.facade.requestLogin()).toEqual({ status: "unavailable" });
          expect(f.credential.calls).toBe(1);
        }
      });
    }

    it(`late rejection from ${stage} cannot change a retried session or feedback`, async () => {
      const f = fixture(), old = f.facade.requestLogin();
      if (stage === "exchange") await f.acquire();
      f.facade.cancel();
      const next = f.facade.requestLogin(); expect(next).not.toBe(old);
      await f.acquire(1);
      f.exchanges[stage === "exchange" ? 1 : 0]?.resolve(f.grant); await next;
      if (stage === "credential") f.credentials[0]?.reject(new Error("late-private-token-error"));
      else f.exchanges[0]?.reject(new Error("late-private-token-error"));
      await Promise.resolve(); f.callbacks[0]?.();
      expect(f.facade.snapshot()).toMatchObject({ auth: { status: "active" }, feedback: "active" });
    });
  }

  it("rejects a delayed credential past the deadline without exchange", async () => {
    const f = fixture(), result = f.facade.requestLogin();
    f.setTime(1100); await f.acquire();
    expect(await result).toEqual({ status: "timeout" });
    expect(f.exchange.calls).toBe(0); expect(f.facade.snapshot().feedback).toBe("timeout");
  });

  it("never projects a platform token as authenticated if trusted exchange rejects", async () => {
    const f = fixture(), result = f.facade.requestLogin(); await f.acquire();
    f.exchanges[0]?.reject(new Error("private-verification-error"));
    expect(await result).toEqual({ status: "failed" });
    expect(f.facade.snapshot()).toMatchObject({ auth: { status: "guest" }, feedback: "failed", canRequestLogin: true, localPlayAvailable: true });
    expect(JSON.stringify(f.facade.snapshot())).not.toContain("private-verification-error");
  });

  it("projects expiry and logout ahead of the old active result", async () => {
    const f = fixture(); await f.activate();
    f.setTime(2000);
    expect(f.facade.snapshot()).toMatchObject({ auth: { status: "expired" }, feedback: "expired", canRequestLogin: true });
    f.facade.logout(); expect(f.facade.snapshot()).toMatchObject({ auth: { status: "guest" }, feedback: "guest" });
  });

  it("does not lose the new attempt's failure feedback during reentrant cancellation/retry", async () => {
    const f = fixture();
    let retry: ReturnType<LoginFacade["requestLogin"]> | undefined;
    f.clock.schedule = (callback) => {
      f.clock.schedule = cb => { f.callbacks.push(cb); return cb; };
      f.facade.cancel(); retry = f.facade.requestLogin();
      return callback;
    };
    const old = f.facade.requestLogin(); expect(await old).toEqual({ status: "cancelled" });
    expect(f.facade.snapshot().feedback).toBe("pending");
    f.credentials[0]?.reject(new Error("private-retry-error"));
    expect(await retry).toEqual({ status: "failed" });
    expect(f.facade.snapshot().feedback).toBe("failed");
  });

  it("sets disposed before abort observers try to restart login", async () => {
    const f = fixture(), result = f.facade.requestLogin();
    let retried: ReturnType<LoginFacade["requestLogin"]> | undefined;
    f.signals[0]?.addEventListener("abort", () => { retried = f.facade.requestLogin(); });
    f.facade.dispose();
    expect(await result).toEqual({ status: "cancelled" });
    expect(await retried).toEqual({ status: "unavailable" });
    expect(f.credential.calls).toBe(1); expect(f.facade.snapshot().readiness.status).toBe("disposed");
  });

  it("cannot start credential work after an active-session clock disposes the facade", async () => {
    const f = fixture(); await f.activate();
    f.clock.now = () => { f.clock.now = () => 1000; f.facade.dispose(); return 1000; };
    expect(await f.facade.requestLogin()).toEqual({ status: "unavailable" });
    expect(f.credential.calls).toBe(1);
    expect(f.facade.snapshot()).toMatchObject({ auth: { status: "guest" }, readiness: { status: "disposed" }, feedback: "unavailable" });
  });

  it("observes a valid new attempt after an active-session clock logs out", async () => {
    const f = fixture(); await f.activate();
    f.clock.now = () => { f.clock.now = () => 1000; f.facade.logout(); return 1000; };
    const result = f.facade.requestLogin();
    expect(f.credential.calls).toBe(2);
    f.credentials[1]?.reject(new Error("private-retry-failure"));
    expect(await result).toEqual({ status: "failed" });
    expect(f.facade.snapshot()).toMatchObject({ auth: { status: "guest" }, feedback: "failed" });
  });

  it("shares and preserves a retry started by an active-session clock", async () => {
    const f = fixture(); await f.activate();
    let retry: ReturnType<LoginFacade["requestLogin"]> | undefined;
    f.clock.now = () => {
      f.clock.now = () => 1000; f.facade.logout(); retry = f.facade.requestLogin(); return 1000;
    };
    expect(f.facade.requestLogin()).toBe(retry);
    expect(f.credential.calls).toBe(2);
    f.credentials[1]?.reject(new Error("private-retry-failure"));
    expect(await retry).toEqual({ status: "failed" });
    expect(f.facade.snapshot().feedback).toBe("failed");
  });

  it.each([0, -1, NaN, 60001])("rejects invalid timeout %s without platform work", timeoutMs => {
    const f = fixture();
    expect(() => new LoginFacade({ ...f.options, timeoutMs })).toThrow("Invalid login timeout");
    expect(f.credential.calls + f.exchange.calls).toBe(0);
  });
});
