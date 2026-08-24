import { describe, expect, it } from "vitest";

import {
  createEntityId,
  EntityRegistry,
  type EntityId,
} from "../../src/foundation-core/index.js";

function validEntityId(value: string): EntityId {
  const result = createEntityId(value);
  if (!result.ok) {
    throw new Error(`Invalid test entity ID: ${value}`);
  }

  return result.value;
}

describe("createEntityId", () => {
  it("keeps a valid opaque ID unchanged", () => {
    const result = createEntityId("player:primary");

    expect(result).toEqual({ ok: true, value: "player:primary" });
  });

  it.each(["", " ", " player", "player ", "\t"])(
    "rejects invalid ID %j",
    (value) => {
      expect(createEntityId(value)).toEqual({
        ok: false,
        error: { code: "INVALID_ENTITY_ID", value },
      });
    },
  );
});

describe("EntityRegistry", () => {
  it("registers, queries, and removes a payload", () => {
    const registry = new EntityRegistry<{ readonly name: string }>();
    const entityId = validEntityId("npc:merchant");
    const payload = { name: "Merchant" };

    expect(registry.register(entityId, payload)).toEqual({
      ok: true,
      value: undefined,
    });
    expect(registry.has(entityId)).toBe(true);
    expect(registry.get(entityId)).toEqual({ ok: true, value: payload });
    expect(registry.size).toBe(1);
    expect(registry.remove(entityId)).toEqual({ ok: true, value: payload });
    expect(registry.has(entityId)).toBe(false);
    expect(registry.size).toBe(0);
  });

  it("rejects a duplicate without replacing the registered payload", () => {
    const registry = new EntityRegistry<string>();
    const entityId = validEntityId("entity:1");

    registry.register(entityId, "first");

    expect(registry.register(entityId, "second")).toEqual({
      ok: false,
      error: { code: "DUPLICATE_ENTITY_ID", entityId },
    });
    expect(registry.get(entityId)).toEqual({ ok: true, value: "first" });
  });

  it("returns structured errors for missing entities", () => {
    const registry = new EntityRegistry<string>();
    const entityId = validEntityId("missing");
    const expected = {
      ok: false,
      error: { code: "ENTITY_NOT_FOUND", entityId },
    };

    expect(registry.get(entityId)).toEqual(expected);
    expect(registry.remove(entityId)).toEqual(expected);
  });

  it("supports an undefined payload without confusing it with absence", () => {
    const registry = new EntityRegistry<undefined>();
    const entityId = validEntityId("marker");

    registry.register(entityId, undefined);

    expect(registry.get(entityId)).toEqual({ ok: true, value: undefined });
  });
});
