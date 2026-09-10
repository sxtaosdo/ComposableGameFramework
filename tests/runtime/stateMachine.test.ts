import { describe, expect, it } from "vitest";

import { type IState, StateMachine } from "../../assets/runtime/index.js";

describe("StateMachine", () => {
  it("exposes the current state without exposing its storage", async () => {
    type Context = { readonly calls: string[] };
    class HomeState implements IState<Context> {
      public context!: Context;
      public enter(): void {}
      public exit(): void {}
    }
    class PlayState implements IState<Context> {
      public context!: Context;
      public enter(): void {}
      public exit(): void {}
    }

    const machine = new StateMachine<Context>({ calls: [] });
    expect(machine.current).toBeNull();
    expect(machine.is(HomeState)).toBe(false);
    await machine.changeState(HomeState);
    expect(machine.current).toBeInstanceOf(HomeState);
    expect(machine.is(HomeState)).toBe(true);
    expect(machine.is(PlayState)).toBe(false);
    await machine.releaseAllStates();
    expect(machine.current).toBeNull();
    expect(machine.is(HomeState)).toBe(false);
  });

  it("keeps page identity coherent while changing state", async () => {
    const observed: string[] = [];
    type Context = { readonly machine: StateMachine<Context> };
    class HomeState implements IState<Context> {
      public context!: Context;
      public enter(): void {}
      public exit(): void { observed.push(this.context.machine.is(HomeState) ? "home" : "other"); }
    }
    class PlayState implements IState<Context> {
      public context!: Context;
      public enter(): void { observed.push(this.context.machine.is(PlayState) ? "play" : "other"); }
      public exit(): void {}
    }

    const context = {} as Context;
    const machine = new StateMachine(context);
    Object.assign(context, { machine });
    await machine.changeState(HomeState);
    await machine.changeState(PlayState);
    expect(observed).toEqual(["home", "play"]);
  });

  it("exits the current state before entering a fresh instance", async () => {
    const calls: string[] = [];
    type Context = { readonly calls: string[] };
    class HomeState implements IState<Context> {
      public context!: Context;
      public enter(): void { this.context.calls.push("home.enter"); }
      public exit(): void { this.context.calls.push("home.exit"); }
    }
    class PlayState implements IState<Context> {
      public context!: Context;
      public enter(): void { this.context.calls.push("play.enter"); }
      public exit(): void { this.context.calls.push("play.exit"); }
    }

    const machine = new StateMachine<Context>({ calls });
    await machine.changeState(HomeState);
    await machine.changeState(PlayState);
    await machine.changeState(PlayState);

    expect(calls).toEqual([
      "home.enter",
      "home.exit", "play.enter",
      "play.exit", "play.enter",
    ]);
    expect("rollback" in machine).toBe(false);
    expect("stateStack" in machine).toBe(false);
  });

  it("awaits global states and clears their contexts on removal and release", async () => {
    const calls: string[] = [];
    type Context = { readonly calls: string[] };
    class GlobalState implements IState<Context> {
      public static lastInstance: GlobalState | null = null;
      public context!: Context;
      public constructor() { GlobalState.lastInstance = this; }
      public async enter(): Promise<void> { this.context.calls.push("global.enter"); }
      public async exit(): Promise<void> { this.context.calls.push("global.exit"); }
      public update(): void { this.context.calls.push("global.update"); }
    }
    class CurrentState implements IState<Context> {
      public static lastInstance: CurrentState | null = null;
      public context!: Context;
      public constructor() { CurrentState.lastInstance = this; }
      public enter(): void { this.context.calls.push("current.enter"); }
      public exit(): void { this.context.calls.push("current.exit"); }
      public update(): void { this.context.calls.push("current.update"); }
    }

    const machine = new StateMachine<Context>({ calls });
    await machine.addGlobalState(GlobalState);
    await machine.changeState(CurrentState);
    expect(machine.is(CurrentState)).toBe(true);
    expect(machine.current).toBe(CurrentState.lastInstance);
    await machine.update();
    await machine.removeGlobalState(GlobalState);
    expect(GlobalState.lastInstance?.context).toBeNull();
    await machine.addGlobalState(GlobalState);
    await machine.releaseAllStates();

    expect(calls).toEqual([
      "global.enter", "current.enter", "global.update", "current.update", "global.exit",
      "global.enter", "current.exit", "global.exit",
    ]);
    expect(GlobalState.lastInstance?.context).toBeNull();
    expect(CurrentState.lastInstance?.context).toBeNull();
    expect(machine.current).toBeNull();
  });
});
