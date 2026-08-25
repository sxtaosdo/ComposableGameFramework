import { describe, expect, it } from "vitest";

import { CocosAdapter } from "../../src/adapters/cocos/index.js";

describe("CocosAdapter", () => {
  it("owns boot, input, update, presentation, and shutdown without cc runtime types", () => {
    let handler: ((value: number) => void) | undefined;
    let state = 0;
    const rendered: number[] = [];
    const updates: number[] = [];
    const adapter = new CocosAdapter<number, number>({
      input: { subscribe: (next) => { handler = next; return () => { handler = undefined; }; } },
      presentation: { render: (value) => rendered.push(value) },
      dispatchIntent: (value) => { state += value; },
      read: () => state,
      update: (delta) => updates.push(delta),
    });
    adapter.boot();
    handler?.(3);
    adapter.update(0.5);
    adapter.shutdown();
    expect(rendered).toEqual([0, 3]);
    expect(updates).toEqual([0.5]);
    expect(handler).toBeUndefined();
  });
});
