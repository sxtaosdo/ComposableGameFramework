import { describe, expect, it } from "vitest";
import { AuthSession, type AuthClock, type CredentialProof, type IdentityProvider, type PlatformCredential, type SessionIdentity } from "../../assets/auth/index";

function fixtureProof(provider: IdentityProvider): CredentialProof {
  switch (provider) {
    case "wechat": return { kind: "wechat-code", code: "offline-fixture-code" };
    case "douyin": return { kind: "douyin-code", code: "offline-fixture-code", anonymousCode: "offline-anonymous-code" };
    case "google": return { kind: "google-id-token", idToken: "offline-fixture-token", nonce: "fixture-nonce" };
    case "apple": return { kind: "apple-id-token-code", idToken: "offline-fixture-token", authorizationCode: "offline-fixture-code", nonce: "fixture-nonce" };
  }
}

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function fixture() {
  let now = 1000;
  const timers = new Set<unknown>();
  const callbacks: (() => void)[] = [];
  const credentials: ReturnType<typeof deferred<PlatformCredential>>[] = [];
  const exchanges: ReturnType<typeof deferred<SessionIdentity>>[] = [];
  const signals: AbortSignal[] = [];
  const proofs: PlatformCredential[] = [];
  const clock: AuthClock = {
    now: () => now,
    schedule(callback) { timers.add(callback); callbacks.push(callback); return callback; },
    cancel(handle) { timers.delete(handle); },
  };
  const session = new AuthSession({ clock, timeoutMs: 100, ports: {
    credential: { acquire(signal) { signals.push(signal); const d = deferred<PlatformCredential>(); credentials.push(d); return d.promise; } },
    exchange: { exchange(credential, signal) { proofs.push(credential); signals.push(signal); const d = deferred<SessionIdentity>(); exchanges.push(d); return d.promise; } },
  } });
  const credential: PlatformCredential = { provider: "wechat", proof: fixtureProof("wechat"),
    scope: { issuer: "fixture-issuer", applicationId: "fixture-application", host: "fixture-host" } };
  const grant = { gameAccountId: "fixture-game-account", sessionId: "fixture-session", expiresAtMs: 2000 };
  return { session, clock, timers, callbacks, credentials, exchanges, signals, proofs, credential, grant,
    setTime: (value: number) => { now = value; },
    async acquire(index = 0) { credentials[index]?.resolve(credential); await Promise.resolve(); },
    async activate() { const result = session.login(); await this.acquire(); exchanges[0]?.resolve(grant); return result; },
  };
}

describe("AuthSession: offline adapter boundary", () => {
  it("has no implicit login or successful fallback when adapters are absent", async () => {
    let accesses = 0;
    const session = new AuthSession({ timeoutMs: 100, clock: {
      now() { accesses++; throw new Error("unused"); }, schedule() { accesses++; }, cancel() { accesses++; },
    } });
    expect(session.snapshot()).toEqual({ status: "guest" });
    expect(await session.login()).toEqual({ status: "unavailable" });
    expect(session.snapshot()).toEqual({ status: "guest" });
    expect(accesses).toBe(0);
  });

  it("shares one Promise and both adapter stages across concurrent callers", async () => {
    const f = fixture(), first = f.session.login();
    expect(f.session.login()).toBe(first);
    expect(f.credentials).toHaveLength(1);
    await f.acquire();
    expect(f.session.login()).toBe(first);
    expect(f.exchanges).toHaveLength(1);
    f.exchanges[0]?.resolve({ ...f.grant, ...{ bearerToken: "must-not-project" } });
    expect(await first).toEqual({ status: "active", session: f.grant });
    expect(f.session.snapshot()).toEqual({ status: "active", session: f.grant });
    expect(JSON.stringify(f.session.snapshot())).not.toContain("proof");
    expect(JSON.stringify(f.session.snapshot())).not.toContain("bearerToken");
    expect(f.proofs).toEqual([f.credential]);
    expect(f.timers.size).toBe(0);
    expect(f.signals[0]?.aborted).toBe(false);
    expect(Object.isFrozen(f.session.snapshot())).toBe(true);
    expect(await f.session.login()).toEqual({ status: "active", session: f.grant });
    expect(f.credentials).toHaveLength(1);
  });

  for (const stage of ["credential", "exchange"] as const) {
    for (const action of ["cancel", "logout", "timeout"] as const) {
      it(`${action} settles immediately at ${stage}; late success cannot resurrect a session`, async () => {
        const f = fixture(), result = f.session.login();
        if (stage === "exchange") await f.acquire();
        if (action === "timeout") { f.setTime(1100); f.callbacks[0]?.(); }
        else f.session[action]();
        expect(await result).toEqual({ status: action === "timeout" ? "timeout" : "cancelled" });
        expect(f.session.snapshot()).toEqual({ status: "guest" });
        expect(f.signals.every(signal => signal.aborted)).toBe(true);
        expect(f.timers.size).toBe(0);
        if (stage === "credential") await f.acquire();
        else { f.exchanges[0]?.resolve(f.grant); await Promise.resolve(); }
        expect(f.exchanges).toHaveLength(stage === "credential" ? 0 : 1);
        expect(f.session.snapshot()).toEqual({ status: "guest" });
      });
    }

    it(`late rejection at ${stage} cannot clear a newer successful session`, async () => {
      const f = fixture(), old = f.session.login();
      if (stage === "exchange") await f.acquire();
      f.session.cancel(); await old;
      const next = f.session.login(); await f.acquire(1);
      const nextExchange = stage === "exchange" ? 1 : 0;
      f.exchanges[nextExchange]?.resolve(f.grant); await next;
      if (stage === "credential") f.credentials[0]?.reject(new Error("late-private-error"));
      else f.exchanges[0]?.reject(new Error("late-private-error"));
      await Promise.resolve(); f.callbacks[0]?.();
      expect(f.session.snapshot()).toEqual({ status: "active", session: f.grant });
    });

    it(`rejects results after the absolute timeout at ${stage}, even with delayed timers`, async () => {
      const f = fixture(), result = f.session.login();
      if (stage === "exchange") await f.acquire();
      f.setTime(1100);
      if (stage === "credential") await f.acquire();
      else f.exchanges[0]?.resolve(f.grant);
      expect(await result).toEqual({ status: "timeout" });
      expect(f.session.snapshot()).toEqual({ status: "guest" });
      expect(f.timers.size).toBe(0);
    });

    it(`classifies rejection after the absolute deadline at ${stage} as timeout`, async () => {
      const f = fixture(), result = f.session.login();
      if (stage === "exchange") await f.acquire();
      f.setTime(1100);
      if (stage === "credential") f.credentials[0]?.reject(new Error("late-private-error"));
      else f.exchanges[0]?.reject(new Error("late-private-error"));
      expect(await result).toEqual({ status: "timeout" });
      expect(f.timers.size).toBe(0);
    });
  }

  it("expires on access at the exact deadline and then obtains a new credential", async () => {
    const f = fixture(); await f.activate(); f.setTime(2000);
    expect(f.session.snapshot()).toEqual({ status: "expired" });
    const next = f.session.login(); expect(f.credentials).toHaveLength(2);
    f.session.logout(); expect(await next).toEqual({ status: "cancelled" });
    expect(f.session.snapshot()).toEqual({ status: "guest" });
  });

  it.each([NaN, Infinity, -1, 1.5, 1000, 999])("rejects malformed or expired grant deadline %s", async (expiresAtMs) => {
    const f = fixture(), result = f.session.login(); await f.acquire();
    f.exchanges[0]?.resolve({ ...f.grant, expiresAtMs });
    expect((await result).status).toBe(Number.isSafeInteger(expiresAtMs) && expiresAtMs >= 0 ? "expired" : "failed");
    expect(f.session.snapshot().status).not.toBe("active");
  });

  it("a failing adapter preserves guest and permits explicit retry without exposing its error", async () => {
    const f = fixture(), result = f.session.login();
    f.credentials[0]?.reject(new Error("secret-token-url-save"));
    expect(await result).toEqual({ status: "failed" });
    expect(f.session.snapshot()).toEqual({ status: "guest" });
    const next = f.session.login(); f.session.cancel();
    expect(await next).toEqual({ status: "cancelled" });
  });

  it.each(["wechat", "douyin", "google", "apple"] as const)("accepts %s as an explicit adapter label without invoking a platform SDK", async (provider) => {
    const f = fixture(), result = f.session.login();
    f.credentials[0]?.resolve({ ...f.credential, provider, proof: fixtureProof(provider) }); await Promise.resolve();
    f.exchanges[0]?.resolve(f.grant);
    expect(await result).toEqual({ status: "active", session: f.grant });
    expect(f.proofs[0]?.provider).toBe(provider);
  });

  it("rejects proof from another platform before requesting session exchange", async () => {
    const f = fixture(), result = f.session.login();
    f.credentials[0]?.resolve({ ...f.credential, provider: "google" });
    expect(await result).toEqual({ status: "failed" });
    expect(f.exchanges).toHaveLength(0);
  });

  it.each(["issuer", "applicationId", "host"] as const)("rejects missing %s routing scope before exchange", async (field) => {
    const f = fixture(), result = f.session.login();
    f.credentials[0]?.resolve({ ...f.credential, scope: { ...f.credential.scope, [field]: "" } });
    expect(await result).toEqual({ status: "failed" });
    expect(f.exchanges).toHaveLength(0);
  });

  it("ignores an old successful exchange while the new attempt is still pending", async () => {
    const f = fixture(), old = f.session.login(); await f.acquire(); f.session.logout(); await old;
    const next = f.session.login(); f.exchanges[0]?.resolve(f.grant); await Promise.resolve();
    expect(f.session.snapshot()).toEqual({ status: "pending" });
    f.session.cancel(); await next;
  });

  it("rejects identity accessors without executing them", async () => {
    const f = fixture(), result = f.session.login(); await f.acquire();
    const grant = { ...f.grant };
    let accessed = 0;
    Object.defineProperty(grant, "gameAccountId", { get() { accessed++; return "fixture-game-account"; } });
    f.exchanges[0]?.resolve(grant);
    expect(await result).toEqual({ status: "failed" });
    expect(accessed).toBe(0);
    expect(f.session.snapshot()).toEqual({ status: "guest" });
  });

  it("rejects a changing provider accessor without reading it or exchanging its proof", async () => {
    const f = fixture(), result = f.session.login();
    let accessed = 0;
    const credential = { ...f.credential, proof: fixtureProof("google") };
    Object.defineProperty(credential, "provider", { get() { return accessed++ === 0 ? "wechat" : "google"; } });
    f.credentials[0]?.resolve(credential);
    expect(await result).toEqual({ status: "failed" });
    expect(accessed).toBe(0);
    expect(f.exchanges).toHaveLength(0);
  });

  it("rejects routing accessors without executing reentrant cancellation", async () => {
    const f = fixture(), result = f.session.login();
    let accessed = 0;
    const scope = { ...f.credential.scope };
    Object.defineProperty(scope, "issuer", { get() { accessed++; f.session.cancel(); return "fixture-issuer"; } });
    f.credentials[0]?.resolve({ ...f.credential, scope });
    expect(await result).toEqual({ status: "failed" });
    expect(accessed).toBe(0);
    expect(f.exchanges).toHaveLength(0);
  });

  it("does not exchange after a proxy descriptor trap cancels the attempt", async () => {
    const f = fixture(), result = f.session.login();
    const scope = new Proxy(f.credential.scope, { getOwnPropertyDescriptor(target, key) {
      f.session.cancel(); return Object.getOwnPropertyDescriptor(target, key);
    } });
    f.credentials[0]?.resolve({ ...f.credential, scope });
    expect(await result).toEqual({ status: "cancelled" });
    expect(f.exchanges).toHaveLength(0);
  });

  it.each(["snapshot", "login"] as const)("%s preserves a retry started by a reentrant clock callback", async (action) => {
    const f = fixture(); await f.activate();
    let retry: Promise<unknown> | undefined;
    f.clock.now = () => {
      f.clock.now = () => 2000;
      f.session.logout(); retry = f.session.login();
      return 2000;
    };
    const result = f.session[action]();
    expect(f.session.snapshot()).toEqual({ status: "pending" });
    expect(f.credentials).toHaveLength(2);
    if (action === "login") expect(result).toBe(retry);
    f.session.cancel(); expect(await retry).toEqual({ status: "cancelled" });
  });

  it("a clock failure cannot overwrite a retry started by that clock callback", async () => {
    const f = fixture(); await f.activate();
    let retry: Promise<unknown> | undefined;
    f.clock.now = () => {
      f.clock.now = () => 2000;
      f.session.logout(); retry = f.session.login();
      throw new Error("clock-after-retry");
    };
    expect(f.session.snapshot()).toEqual({ status: "pending" });
    f.session.cancel(); expect(await retry).toEqual({ status: "cancelled" });
  });

  it("validates clock and timeout, including scheduler and cleanup failures", async () => {
    const f = fixture();
    expect(() => new AuthSession({ clock: f.clock, timeoutMs: 0 })).toThrow();
    f.setTime(NaN); expect(await f.session.login()).toEqual({ status: "failed" });
    f.setTime(1000);
    f.clock.schedule = () => { throw new Error("scheduler"); };
    expect(await f.session.login()).toEqual({ status: "failed" });
    f.clock.schedule = (callback) => { callback(); return "already-fired"; };
    f.clock.cancel = () => { throw new Error("cleanup"); };
    expect(await f.session.login()).toEqual({ status: "timeout" });
    expect(f.credentials).toHaveLength(0);
  });
});
