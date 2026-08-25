export interface CocosInputPort<TIntent> {
  subscribe(handler: (intent: TIntent) => void): () => void;
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

