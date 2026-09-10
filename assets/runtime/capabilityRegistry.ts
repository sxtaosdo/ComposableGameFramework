import { failure, success, type Result } from "../foundation-core/result";

export interface CapabilityError {
  readonly code: "CAPABILITY_DUPLICATE" | "CAPABILITY_MISSING";
  readonly capabilityId: string;
}

export class CapabilityRegistry {
  private readonly values = new Map<string, unknown>();

  public provide<T>(capabilityId: string, value: T): Result<() => void, CapabilityError> {
    if (this.values.has(capabilityId)) {
      return failure({ code: "CAPABILITY_DUPLICATE", capabilityId });
    }
    this.values.set(capabilityId, value);
    return success(() => this.values.delete(capabilityId));
  }

  public get<T>(capabilityId: string): Result<T, CapabilityError> {
    if (!this.values.has(capabilityId)) {
      return failure({ code: "CAPABILITY_MISSING", capabilityId });
    }
    return success(this.values.get(capabilityId) as T);
  }
}

