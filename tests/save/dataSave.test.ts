import { describe, expect, it } from "vitest";

import { loadConfig } from "../../src/data/index.js";
import { failure, success } from "../../src/foundation-core/index.js";
import { SaveCoordinator, serializeSnapshot } from "../../src/save/index.js";

describe("data and save boundaries", () => {
  it("accepts valid config and returns structured invalid-config errors", () => {
    const validator = (input: unknown) => typeof input === "number"
      ? success({ value: input })
      : failure({ code: "INVALID_CONFIG" as const, path: "$.value", message: "expected number" });
    expect(loadConfig(4, validator)).toEqual({ ok: true, value: { value: 4 } });
    expect(loadConfig("4", validator)).toEqual({
      ok: false,
      error: { code: "INVALID_CONFIG", path: "$.value", message: "expected number" },
    });
  });

  it("captures sections in deterministic order and restores feature-owned state", () => {
    let first = 1;
    let second = 2;
    const save = new SaveCoordinator("1.5.0");
    save.register({ id: "z", capture: () => success(second), restore: (value) => { second = value as number; return success(undefined); } });
    save.register({ id: "a", capture: () => success(first), restore: (value) => { first = value as number; return success(undefined); } });
    const captured = save.capture();
    expect(captured.ok).toBe(true);
    if (!captured.ok) return;
    expect(serializeSnapshot(captured.value)).toBe('{"schemaVersion":1,"frameworkVersion":"1.5.0","sections":{"a":1,"z":2}}');
    first = 9;
    second = 9;
    expect(save.restore(captured.value).ok).toBe(true);
    expect([first, second]).toEqual([1, 2]);
  });

  it("returns structured failures for incompatible and incomplete snapshots", () => {
    const save = new SaveCoordinator("1.5.0");
    save.register({ id: "state", capture: () => success(1), restore: () => success(undefined) });
    expect(save.restore({ schemaVersion: 1, frameworkVersion: "1.4.1", sections: { state: 1 } })).toEqual({
      ok: false,
      error: { code: "SAVE_VERSION_UNSUPPORTED", sectionId: "$snapshot" },
    });
    expect(save.restore({ schemaVersion: 1, frameworkVersion: "1.5.0", sections: {} })).toEqual({
      ok: false,
      error: { code: "SAVE_SECTION_MISSING", sectionId: "state" },
    });
  });
});
