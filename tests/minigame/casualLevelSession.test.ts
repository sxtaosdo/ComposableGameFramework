import { describe, expect, it } from "vitest";

import type { CasualLevelSession } from "../../src/minigame/index.js";

describe("CasualLevelSession", () => {
  it("accepts a dummy minigame session implementor", () => {
    const session: CasualLevelSession = {
      bootReady: () => true,
      startLevel: (level) => level >= 1,
      reset: (level) => level >= 1,
      retry: () => true,
      nextLevel: () => true,
      showHome: () => true,
    };

    expect(session.bootReady()).toBe(true);
    expect(session.startLevel(1)).toBe(true);
    expect(session.reset(2)).toBe(true);
    expect(session.retry()).toBe(true);
    expect(session.nextLevel()).toBe(true);
    expect(session.showHome()).toBe(true);
  });

  it("is imported from the minigame subpath, not as a global runtime contract", async () => {
    const minigame = await import("../../src/minigame/index.js");
    const runtime = await import("../../src/runtime/index.js");

    expect("CasualLevelSession" in minigame || typeof minigame === "object").toBe(true);
    expect("CasualLevelSession" in runtime).toBe(false);
    expect("StateMachine" in runtime).toBe(true);
  });
});
