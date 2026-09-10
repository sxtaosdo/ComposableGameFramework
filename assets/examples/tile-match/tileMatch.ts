import { loadConfig, type ConfigValidationError } from "../../data/index.js";
import { failure, success, type Result } from "../../foundation-core/result.js";
import { MessageRuntime, type Event } from "../../foundation-core/messaging.js";
import type { SaveSection } from "../../save/index.js";
import type { Feature, FeatureContext, FeatureOperationError } from "../../runtime/index.js";
import type { SaveCoordinator } from "../../save/index.js";

export type Tile = "A" | "B" | "C" | null;

export interface TileLevelConfig {
  readonly width: number;
  readonly height: number;
  readonly tiles: readonly Tile[];
}

export interface TileState {
  readonly tiles: readonly Tile[];
  readonly score: number;
}

export interface SwapPolicy {
  resolve(state: TileState, from: number, to: number, config: TileLevelConfig): Result<TileState, TileError>;
}

export interface TileError {
  readonly code: "INVALID_SWAP" | "NO_MATCH" | "INVALID_STATE";
}

export type SwapCommand = { readonly type: "tile.swap"; readonly payload: { readonly from: number; readonly to: number } };
export type BoardQuery = { readonly type: "tile.board"; readonly payload: Record<string, never> };
export type MatchEvent = Event<"tile.match-resolved", { readonly cleared: number; readonly score: number }>;

export function validateLevel(input: unknown): Result<TileLevelConfig, ConfigValidationError> {
  if (typeof input !== "object" || input === null) {
    return failure({ code: "INVALID_CONFIG", path: "$", message: "expected object" });
  }
  const value = input as Record<string, unknown>;
  const width = value.width;
  const height = value.height;
  const tiles = value.tiles;
  if (!Number.isInteger(width) || !Number.isInteger(height) || (width as number) <= 0 || (height as number) <= 0) {
    return failure({ code: "INVALID_CONFIG", path: "$.width|height", message: "expected positive integers" });
  }
  if (!Array.isArray(tiles) || tiles.length !== (width as number) * (height as number) || tiles.some((tile) => !isFilledTile(tile))) {
    return failure({ code: "INVALID_CONFIG", path: "$.tiles", message: "expected a complete A/B/C tile board" });
  }
  return success({ width: width as number, height: height as number, tiles: tiles as Tile[] });
}

export class MatchThreePolicy implements SwapPolicy {
  public resolve(state: TileState, from: number, to: number, config: TileLevelConfig): Result<TileState, TileError> {
    if (!areAdjacent(from, to, config.width, config.height)) {
      return failure({ code: "INVALID_SWAP" });
    }
    const swapped = [...state.tiles];
    [swapped[from], swapped[to]] = [swapped[to] ?? null, swapped[from] ?? null];
    const matched = findMatches(swapped, config.width, config.height);
    if (matched.size === 0) {
      return failure({ code: "NO_MATCH" });
    }
    for (const index of matched) {
      swapped[index] = null;
    }
    return success({ tiles: swapped, score: state.score + matched.size });
  }
}

export class TileMatchSession implements SaveSection<TileState> {
  public readonly id = "tile-match";
  private state: TileState;
  private cleanup: (() => void)[] = [];

  private constructor(
    private readonly config: TileLevelConfig,
    private readonly messages: MessageRuntime,
    private readonly policy: SwapPolicy,
  ) {
    this.state = { tiles: [...config.tiles], score: 0 };
  }

  public static create(input: unknown, messages: MessageRuntime, policy: SwapPolicy = new MatchThreePolicy()): Result<TileMatchSession, ConfigValidationError> {
    const config = loadConfig(input, validateLevel);
    return config.ok ? success(new TileMatchSession(config.value, messages, policy)) : config;
  }

  public activate(): Result<void, FeatureOperationError> {
    const command = this.messages.registerCommand<SwapCommand, TileState, TileError>("tile.swap", (message) => {
      const previousScore = this.state.score;
      const resolved = this.policy.resolve(this.state, message.payload.from, message.payload.to, this.config);
      if (!resolved.ok) {
        return resolved;
      }
      this.state = resolved.value;
      this.messages.publish({
        type: "tile.match-resolved",
        payload: { cleared: this.state.score - previousScore, score: this.state.score },
      } satisfies MatchEvent);
      return success(this.read());
    });
    if (!command.ok) return failure({ code: command.error.code, featureId: this.id });
    const query = this.messages.registerQuery<BoardQuery, TileState, never>("tile.board", () => success(this.read()));
    if (!query.ok) {
      command.value();
      return failure({ code: query.error.code, featureId: this.id });
    }
    this.cleanup = [command.value, query.value];
    return success(undefined);
  }

  public deactivate(): void {
    this.cleanup.forEach((cleanup) => cleanup());
    this.cleanup = [];
  }

  public read(): TileState {
    return { tiles: [...this.state.tiles], score: this.state.score };
  }

  public capture(): Result<TileState, never> {
    return success(this.read());
  }

  public restore(state: unknown): Result<void, TileError> {
    if (!isTileState(state, this.config.tiles.length)) {
      return failure({ code: "INVALID_STATE" });
    }
    this.state = { tiles: [...state.tiles], score: state.score };
    return success(undefined);
  }
}

export class TileMatchFeature implements Feature {
  public readonly id = "feature.tile-match";
  public readonly dependencies: readonly string[] = [];
  private unregisterSave?: () => void;

  public constructor(private readonly session: TileMatchSession) {}

  public register(context: FeatureContext): Result<void, FeatureOperationError> {
    const save = context.capabilities.get<SaveCoordinator>("framework.save");
    if (!save.ok) return failure({ code: save.error.code, featureId: this.id });
    const registered = save.value.register(this.session);
    if (!registered.ok) return failure({ code: registered.error.code, featureId: this.id });
    this.unregisterSave = registered.value;
    context.onCleanup(this.unregisterSave);
    return success(undefined);
  }

  public activate(): Result<void, FeatureOperationError> {
    return this.session.activate();
  }

  public deactivate(): void {
    this.session.deactivate();
    this.unregisterSave = undefined;
  }
}

function areAdjacent(from: number, to: number, width: number, height: number): boolean {
  if (from < 0 || to < 0 || from >= width * height || to >= width * height) return false;
  const rowDistance = Math.abs(Math.floor(from / width) - Math.floor(to / width));
  const columnDistance = Math.abs((from % width) - (to % width));
  return rowDistance + columnDistance === 1;
}

function findMatches(tiles: readonly Tile[], width: number, height: number): Set<number> {
  const matched = new Set<number>();
  const addRun = (indices: number[]) => {
    if (indices.length >= 3) indices.forEach((index) => matched.add(index));
  };
  for (let row = 0; row < height; row += 1) {
    collectLine(Array.from({ length: width }, (_, column) => row * width + column), tiles, addRun);
  }
  for (let column = 0; column < width; column += 1) {
    collectLine(Array.from({ length: height }, (_, row) => row * width + column), tiles, addRun);
  }
  return matched;
}

function collectLine(indices: number[], tiles: readonly Tile[], addRun: (indices: number[]) => void): void {
  let run: number[] = [];
  for (const index of indices) {
    if (run.length === 0 || (tiles[index] !== null && tiles[index] === tiles[run[0] as number])) {
      run.push(index);
    } else {
      addRun(run);
      run = [index];
    }
  }
  addRun(run);
}

function isTileState(value: unknown, length: number): value is TileState {
  if (typeof value !== "object" || value === null) return false;
  const state = value as Record<string, unknown>;
  return Array.isArray(state.tiles) && state.tiles.length === length && state.tiles.every((tile) => tile === null || isFilledTile(tile)) && Number.isInteger(state.score);
}

function isFilledTile(value: unknown): value is Exclude<Tile, null> {
  return value === "A" || value === "B" || value === "C";
}
