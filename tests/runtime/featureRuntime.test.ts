import { describe, expect, it } from "vitest";

import { failure, success } from "../../src/foundation-core/index.js";
import { FeatureRuntime, type Feature, type FeatureContext } from "../../src/runtime/index.js";

function feature(id: string, dependencies: readonly string[], log: string[], fail = false): Feature {
  let cleanup: (() => void) | undefined;
  return {
    id,
    dependencies,
    register(context: FeatureContext) {
      log.push(`register:${id}`);
      const provided = context.capabilities.provide(`capability:${id}`, id);
      if (!provided.ok) return failure({ code: provided.error.code, featureId: id });
      cleanup = provided.value;
      context.onCleanup(cleanup);
      return success(undefined);
    },
    activate() {
      log.push(`activate:${id}`);
      return fail ? failure({ code: "ACTIVATION_FAILED", featureId: id }) : success(undefined);
    },
    deactivate() {
      log.push(`deactivate:${id}`);
      cleanup = undefined;
    },
  };
}

describe("FeatureRuntime", () => {
  it("resolves and activates dependencies deterministically, then supports reactivation", () => {
    const log: string[] = [];
    const runtime = new FeatureRuntime();
    runtime.add(feature("c", ["b"], log));
    runtime.add(feature("a", [], log));
    runtime.add(feature("b", ["a"], log));
    const order = runtime.resolveOrder();
    expect(order.ok ? order.value.map((item) => item.id) : order.error).toEqual(["a", "b", "c"]);
    expect(runtime.activate().ok).toBe(true);
    runtime.deactivate();
    expect(runtime.activate().ok).toBe(true);
    runtime.deactivate();
    expect(log.slice(0, 9)).toEqual([
      "register:a", "activate:a", "register:b", "activate:b", "register:c", "activate:c",
      "deactivate:c", "deactivate:b", "deactivate:a",
    ]);
  });

  it("detects cycles and missing dependencies", () => {
    const cycle = new FeatureRuntime();
    cycle.add(feature("a", ["b"], []));
    cycle.add(feature("b", ["a"], []));
    expect(cycle.activate()).toEqual({ ok: false, error: { code: "FEATURE_DEPENDENCY_CYCLE", featureId: "a" } });
    const missing = new FeatureRuntime();
    missing.add(feature("a", ["missing"], []));
    expect(missing.activate()).toEqual({
      ok: false,
      error: { code: "FEATURE_DEPENDENCY_MISSING", featureId: "a", dependencyId: "missing" },
    });
  });

  it("cleans up the failing feature and already-active dependencies", () => {
    const log: string[] = [];
    const runtime = new FeatureRuntime();
    runtime.add(feature("a", [], log));
    runtime.add(feature("b", ["a"], log, true));
    expect(runtime.activate()).toEqual({ ok: false, error: { code: "ACTIVATION_FAILED", featureId: "b" } });
    expect(log).toEqual(["register:a", "activate:a", "register:b", "activate:b", "deactivate:b", "deactivate:a"]);
    expect(runtime.capabilities.get("capability:a").ok).toBe(false);
    expect(runtime.capabilities.get("capability:b").ok).toBe(false);
  });

  it("cleans up partial registration side effects when register fails", () => {
    const runtime = new FeatureRuntime();
    runtime.add({
      id: "partial",
      dependencies: [],
      register(context) {
        const provided = context.capabilities.provide("partial-capability", true);
        if (!provided.ok) return failure({ code: provided.error.code, featureId: "partial" });
        context.onCleanup(provided.value);
        return failure({ code: "REGISTER_FAILED", featureId: "partial" });
      },
      activate() { return success(undefined); },
      deactivate() {},
    });

    expect(runtime.activate()).toEqual({ ok: false, error: { code: "REGISTER_FAILED", featureId: "partial" } });
    expect(runtime.capabilities.get("partial-capability").ok).toBe(false);
    expect(runtime.activate()).toEqual({ ok: false, error: { code: "REGISTER_FAILED", featureId: "partial" } });
  });
});
