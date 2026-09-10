export interface IState<T> {
  context: T;
  enter(...args: any[]): void | Promise<void>;
  exit(...args: any[]): void | Promise<void>;
  update?(...args: any[]): void | Promise<void>;
}

export class StateMachine<T> {
  private currentState: IState<T> | null = null;
  private readonly globalStates = new Map<Function, IState<T>>();

  public constructor(public context: T) {}

  public get current(): IState<T> | null {
    return this.currentState;
  }

  public is(StateClass: new () => IState<T>): boolean {
    return this.currentState instanceof StateClass;
  }

  public async addGlobalState(StateClass: new () => IState<T>): Promise<void> {
    if (this.globalStates.has(StateClass)) return;
    const state = new StateClass();
    state.context = this.context;
    await state.enter();
    this.globalStates.set(StateClass, state);
  }

  public async removeGlobalState(StateClass: new () => IState<T>): Promise<void> {
    const state = this.globalStates.get(StateClass);
    if (!state) return;
    await state.exit();
    state.context = null!;
    this.globalStates.delete(StateClass);
  }

  public async changeState(StateClass: new () => IState<T>, enterParams?: any): Promise<void> {
    if (this.currentState) {
      await this.currentState.exit();
      this.currentState.context = null!;
    }
    this.currentState = new StateClass();
    this.currentState.context = this.context;
    await this.currentState.enter(enterParams);
  }

  public async update(...args: any[]): Promise<void> {
    for (const state of this.globalStates.values()) await state.update?.(...args);
    await this.currentState?.update?.(...args);
  }

  public async releaseAllStates(): Promise<void> {
    if (this.currentState) {
      await this.currentState.exit();
      this.currentState.context = null!;
      this.currentState = null;
    }
    for (const state of this.globalStates.values()) {
      await state.exit();
      state.context = null!;
    }
    this.globalStates.clear();
  }
}
