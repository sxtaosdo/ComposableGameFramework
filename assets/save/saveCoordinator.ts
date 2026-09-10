import { failure, success, type Result } from "../foundation-core/result";

export interface SaveSection<TState = unknown> {
  readonly id: string;
  capture(): Result<TState, SaveSectionError>;
  restore(state: unknown): Result<void, SaveSectionError>;
}

export interface SaveSectionError {
  readonly code: string;
  readonly cause?: string;
}

export interface FrameworkSnapshot {
  readonly schemaVersion: 1;
  readonly frameworkVersion: string;
  readonly sections: Readonly<Record<string, unknown>>;
}

export interface SaveError {
  readonly code: "SAVE_SECTION_DUPLICATE" | "SAVE_CAPTURE_FAILED" | "SAVE_RESTORE_FAILED" | "SAVE_SECTION_MISSING" | "SAVE_VERSION_UNSUPPORTED";
  readonly sectionId: string;
  readonly cause?: string;
}

export class SaveCoordinator {
  private readonly sections = new Map<string, SaveSection>();

  public constructor(private readonly frameworkVersion: string) {}

  public register(section: SaveSection): Result<() => void, SaveError> {
    if (this.sections.has(section.id)) {
      return failure({ code: "SAVE_SECTION_DUPLICATE", sectionId: section.id });
    }
    this.sections.set(section.id, section);
    return success(() => this.sections.delete(section.id));
  }

  public capture(): Result<FrameworkSnapshot, SaveError> {
    const states: Record<string, unknown> = {};
    for (const id of [...this.sections.keys()].sort()) {
      const captured = this.sections.get(id)?.capture();
      if (captured === undefined || !captured.ok) {
        return failure({
          code: "SAVE_CAPTURE_FAILED",
          sectionId: id,
          cause: captured?.error.cause ?? captured?.error.code,
        });
      }
      states[id] = captured.value;
    }
    return success({ schemaVersion: 1, frameworkVersion: this.frameworkVersion, sections: states });
  }

  public restore(snapshot: FrameworkSnapshot): Result<void, SaveError> {
    if (snapshot.schemaVersion !== 1 || snapshot.frameworkVersion !== this.frameworkVersion) {
      return failure({ code: "SAVE_VERSION_UNSUPPORTED", sectionId: "$snapshot" });
    }
    for (const id of [...this.sections.keys()].sort()) {
      if (!(id in snapshot.sections)) {
        return failure({ code: "SAVE_SECTION_MISSING", sectionId: id });
      }
      const restored = this.sections.get(id)?.restore(snapshot.sections[id]);
      if (restored === undefined || !restored.ok) {
        return failure({
          code: "SAVE_RESTORE_FAILED",
          sectionId: id,
          cause: restored?.error.cause ?? restored?.error.code,
        });
      }
    }
    return success(undefined);
  }
}

export function serializeSnapshot(snapshot: FrameworkSnapshot): string {
  return JSON.stringify(snapshot);
}
