import { failure, success, type Result } from "./result";

export interface FrameworkMessage<TType extends string, TPayload> {
  readonly type: TType;
  readonly payload: TPayload;
}

export type Command<TType extends string, TPayload> = FrameworkMessage<TType, TPayload>;
export type Query<TType extends string, TPayload> = FrameworkMessage<TType, TPayload>;
export type Event<TType extends string, TPayload> = FrameworkMessage<TType, TPayload>;

export interface MessageHandlerMissingError {
  readonly code: "MESSAGE_HANDLER_MISSING";
  readonly messageType: string;
}

export interface MessageHandlerDuplicateError {
  readonly code: "MESSAGE_HANDLER_DUPLICATE";
  readonly messageType: string;
}

type Handler<TMessage, TValue, TError> = (
  message: TMessage,
) => Result<TValue, TError>;

export class MessageRuntime {
  private readonly commandHandlers = new Map<string, Handler<Command<string, unknown>, unknown, unknown>>();
  private readonly queryHandlers = new Map<string, Handler<Query<string, unknown>, unknown, unknown>>();
  private readonly eventHandlers = new Map<string, Set<(event: Event<string, unknown>) => void>>();

  public registerCommand<TCommand extends Command<string, unknown>, TValue, TError>(
    type: TCommand["type"],
    handler: Handler<TCommand, TValue, TError>,
  ): Result<() => void, MessageHandlerDuplicateError> {
    return this.registerSingle(this.commandHandlers, type, handler);
  }

  public registerQuery<TQuery extends Query<string, unknown>, TValue, TError>(
    type: TQuery["type"],
    handler: Handler<TQuery, TValue, TError>,
  ): Result<() => void, MessageHandlerDuplicateError> {
    return this.registerSingle(this.queryHandlers, type, handler);
  }

  public execute<TValue, TError>(
    command: Command<string, unknown>,
  ): Result<TValue, TError | MessageHandlerMissingError> {
    return this.handle(this.commandHandlers, command);
  }

  public query<TValue, TError>(
    query: Query<string, unknown>,
  ): Result<TValue, TError | MessageHandlerMissingError> {
    return this.handle(this.queryHandlers, query);
  }

  public subscribe<TEvent extends Event<string, unknown>>(
    type: TEvent["type"],
    handler: (event: TEvent) => void,
  ): () => void {
    const handlers = this.eventHandlers.get(type) ?? new Set();
    const erasedHandler = handler as (event: Event<string, unknown>) => void;
    handlers.add(erasedHandler);
    this.eventHandlers.set(type, handlers);
    return () => handlers.delete(erasedHandler);
  }

  public publish(event: Event<string, unknown>): void {
    for (const handler of this.eventHandlers.get(event.type) ?? []) {
      handler(event);
    }
  }

  private registerSingle<TMessage, TValue, TError>(
    handlers: Map<string, Handler<TMessage, unknown, unknown>>,
    type: string,
    handler: Handler<TMessage, TValue, TError>,
  ): Result<() => void, MessageHandlerDuplicateError> {
    if (handlers.has(type)) {
      return failure({ code: "MESSAGE_HANDLER_DUPLICATE", messageType: type });
    }
    const erasedHandler = handler as Handler<TMessage, unknown, unknown>;
    handlers.set(type, erasedHandler);
    return success(() => handlers.delete(type));
  }

  private handle<TValue, TError, TMessage extends FrameworkMessage<string, unknown>>(
    handlers: Map<string, Handler<TMessage, unknown, unknown>>,
    message: TMessage,
  ): Result<TValue, TError | MessageHandlerMissingError> {
    const handler = handlers.get(message.type);
    if (handler === undefined) {
      return failure({ code: "MESSAGE_HANDLER_MISSING", messageType: message.type });
    }
    return handler(message) as Result<TValue, TError>;
  }
}

