import { describe, expect, it } from "vitest";

import { ManualClock, MessageRuntime, SeededRandom, failure, success } from "../../assets/foundation-core/index.js";

describe("deterministic primitives", () => {
  it("advances a manual clock only when directed", () => {
    const clock = new ManualClock(100);
    expect(clock.now()).toBe(100);
    clock.advance(16);
    expect(clock.now()).toBe(116);
  });

  it("repeats a seeded random sequence", () => {
    const first = new SeededRandom(42);
    const second = new SeededRandom(42);
    expect([first.next(), first.next(), first.next()]).toEqual([
      second.next(), second.next(), second.next(),
    ]);
  });
});

describe("MessageRuntime", () => {
  it("keeps command, query, and event semantics separate", () => {
    const messages = new MessageRuntime();
    let state = 0;
    const events: number[] = [];
    messages.registerCommand("counter.add", (command) => {
      state += command.payload as number;
      messages.publish({ type: "counter.changed", payload: state });
      return success(state);
    });
    messages.registerQuery("counter.read", () => success(state));
    messages.subscribe("counter.changed", (event) => events.push(event.payload as number));

    expect(messages.execute({ type: "counter.add", payload: 2 })).toEqual({ ok: true, value: 2 });
    expect(messages.query({ type: "counter.read", payload: {} })).toEqual({ ok: true, value: 2 });
    expect(events).toEqual([2]);
  });

  it("returns structured missing, duplicate, and domain failures", () => {
    const messages = new MessageRuntime();
    messages.registerCommand("reject", () => failure({ code: "EXPECTED_FAILURE" }));
    expect(messages.registerCommand("reject", () => success(undefined))).toEqual({
      ok: false,
      error: { code: "MESSAGE_HANDLER_DUPLICATE", messageType: "reject" },
    });
    expect(messages.execute({ type: "reject", payload: {} })).toEqual({
      ok: false,
      error: { code: "EXPECTED_FAILURE" },
    });
    expect(messages.query({ type: "missing", payload: {} })).toEqual({
      ok: false,
      error: { code: "MESSAGE_HANDLER_MISSING", messageType: "missing" },
    });
  });
});
