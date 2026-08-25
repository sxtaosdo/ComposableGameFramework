export interface CocosInputPort<TIntent> {
  subscribe(handler: (intent: TIntent) => void): () => void;
}

/** Minimal Creator-owned shapes. Concrete cc.Node/Input/Component objects stay in this adapter layer. */
export interface CocosNodeLike {
  readonly name: string;
  readonly active: boolean;
}

export interface CocosInputEventTargetLike<TEvent> {
  on(eventType: string, handler: (event: TEvent) => void, target?: unknown): void;
  off(eventType: string, handler: (event: TEvent) => void, target?: unknown): void;
}

export interface CocosComponentLike {
  readonly node: CocosNodeLike;
  readonly enabled: boolean;
}

export interface CocosPresentationPort<TReadModel> {
  render(readModel: TReadModel): void;
}

export interface CocosAdapterOptions<TIntent, TReadModel> {
  readonly input: CocosInputPort<TIntent>;
  readonly presentation: CocosPresentationPort<TReadModel>;
  readonly dispatchIntent: (intent: TIntent) => void;
  readonly read: () => TReadModel;
  readonly update?: (deltaSeconds: number) => void;
}

export class CocosAdapter<TIntent, TReadModel> {
  private unsubscribe?: () => void;

  public constructor(private readonly options: CocosAdapterOptions<TIntent, TReadModel>) {}

  public boot(): void {
    if (this.unsubscribe !== undefined) {
      return;
    }
    this.unsubscribe = this.options.input.subscribe((intent) => {
      this.options.dispatchIntent(intent);
      this.options.presentation.render(this.options.read());
    });
    this.options.presentation.render(this.options.read());
  }

  public update(deltaSeconds: number): void {
    this.options.update?.(deltaSeconds);
  }

  public shutdown(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }
}

/** Delegate these methods from a Cocos Creator 3.8+ Component's lifecycle hooks. */
export class CocosComponentLifecycleHost<TIntent, TReadModel> {
  public constructor(
    private readonly component: CocosComponentLike,
    private readonly adapter: CocosAdapter<TIntent, TReadModel>,
  ) {}

  public onLoad(): void {
    if (this.component.enabled && this.component.node.active) this.adapter.boot();
  }

  public update(deltaTime: number): void {
    if (this.component.enabled && this.component.node.active) this.adapter.update(deltaTime);
  }

  public onDestroy(): void {
    this.adapter.shutdown();
  }
}

export class CocosEventInputPort<TEvent, TIntent> implements CocosInputPort<TIntent> {
  public constructor(
    private readonly target: CocosInputEventTargetLike<TEvent>,
    private readonly eventType: string,
    private readonly toIntent: (event: TEvent) => TIntent,
    private readonly listenerTarget?: unknown,
  ) {}

  public subscribe(handler: (intent: TIntent) => void): () => void {
    const listener = (event: TEvent) => handler(this.toIntent(event));
    this.target.on(this.eventType, listener, this.listenerTarget);
    return () => this.target.off(this.eventType, listener, this.listenerTarget);
  }
}
