import { describe, expect, it } from "vitest";

import { MessageRuntime, success } from "../../assets/foundation-core/index.js";
import { SaveCoordinator } from "../../assets/save/index.js";
import { MatchThreePolicy, TileMatchSession, validateLevel, type SwapPolicy } from "../../assets/examples/tile-match/tileMatch.js";

const level = { width: 3, height: 3, tiles: ["A", "B", "A", "C", "A", "C", "B", "A", "B"] };

describe("tile-match vertical slice", () => {
  it("runs config -> command -> event -> query -> snapshot -> restore", () => {
    const messages = new MessageRuntime();
    const created = TileMatchSession.create(level, messages);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const session = created.value;
    expect(session.activate().ok).toBe(true);
    const events: unknown[] = [];
    messages.subscribe("tile.match-resolved", (event) => events.push(event));
    expect(messages.execute({ type: "tile.swap", payload: { from: 1, to: 4 } })).toMatchObject({ ok: true, value: { score: 3 } });
    expect(events).toEqual([{ type: "tile.match-resolved", payload: { cleared: 3, score: 3 } }]);
    expect(messages.query({ type: "tile.board", payload: {} })).toEqual({ ok: true, value: session.read() });
    const save = new SaveCoordinator("2.0.1");
    save.register(session);
    const snapshot = save.capture();
    expect(snapshot.ok).toBe(true);
    if (!snapshot.ok) return;
    session.restore({ tiles: Array(9).fill("C"), score: 0 });
    save.restore(snapshot.value);
    expect(session.read().score).toBe(3);
    expect(session.read().tiles.filter((tile) => tile === null)).toHaveLength(3);
  });

  it("rejects invalid config and invalid swaps with structured errors", () => {
    expect(validateLevel({ width: 2, height: 2, tiles: ["A"] })).toMatchObject({ ok: false, error: { code: "INVALID_CONFIG" } });
    const policy = new MatchThreePolicy();
    expect(policy.resolve({ tiles: level.tiles as never, score: 0 }, 0, 8, level as never)).toEqual({ ok: false, error: { code: "INVALID_SWAP" } });
  });

  it("allows a product ruleset replacement without changing framework core", () => {
    const replacement: SwapPolicy = {
      resolve: (state) => success({ tiles: state.tiles.map(() => null), score: 99 }),
    };
    const messages = new MessageRuntime();
    const created = TileMatchSession.create(level, messages, replacement);
    if (!created.ok) throw new Error("test config invalid");
    created.value.activate();
    expect(messages.execute({ type: "tile.swap", payload: { from: 0, to: 1 } })).toMatchObject({ ok: true, value: { score: 99 } });
  });
});
