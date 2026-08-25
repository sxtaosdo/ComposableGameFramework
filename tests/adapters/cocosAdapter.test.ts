import { describe, expect, it } from "vitest";

import { CocosAdapter, CocosComponentLifecycleHost, CocosEventInputPort } from "../../src/adapters/cocos/index.js";

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

  it("binds Creator-style event and Component lifecycle seams", () => {
    let listener: ((event: { amount: number }) => void) | undefined;
    const target = {
      on: (_type: string, handler: (event: { amount: number }) => void) => { listener = handler; },
      off: () => { listener = undefined; },
    };
    let state = 0;
    const updates: number[] = [];
    const adapter = new CocosAdapter({
      input: new CocosEventInputPort(target, "touch-end", (event) => event.amount),
      presentation: { render: () => undefined },
      dispatchIntent: (amount: number) => { state += amount; },
      read: () => state,
      update: (delta) => updates.push(delta),
    });
    const host = new CocosComponentLifecycleHost(
      { node: { name: "Board", active: true }, enabled: true },
      adapter,
    );

    host.onLoad();
    listener?.({ amount: 2 });
    host.update(1 / 60);
    host.onDestroy();

    expect(state).toBe(2);
    expect(updates).toEqual([1 / 60]);
    expect(listener).toBeUndefined();
  });
});
