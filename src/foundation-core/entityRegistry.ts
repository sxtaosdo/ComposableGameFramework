import type { EntityId } from "./entityId.js";
import { failure, success, type Result } from "./result.js";

export interface DuplicateEntityIdError {
  readonly code: "DUPLICATE_ENTITY_ID";
  readonly entityId: EntityId;
}

export interface EntityNotFoundError {
  readonly code: "ENTITY_NOT_FOUND";
  readonly entityId: EntityId;
}

export class EntityRegistry<TPayload> {
  private readonly payloadById = new Map<EntityId, TPayload>();

  public get size(): number {
    return this.payloadById.size;
  }

  public register(
    entityId: EntityId,
    payload: TPayload,
  ): Result<void, DuplicateEntityIdError> {
    if (this.payloadById.has(entityId)) {
      return failure({ code: "DUPLICATE_ENTITY_ID", entityId });
    }

    this.payloadById.set(entityId, payload);
    return success(undefined);
  }

  public get(entityId: EntityId): Result<TPayload, EntityNotFoundError> {
    if (!this.payloadById.has(entityId)) {
      return failure({ code: "ENTITY_NOT_FOUND", entityId });
    }

    return success(this.payloadById.get(entityId) as TPayload);
  }

  public has(entityId: EntityId): boolean {
    return this.payloadById.has(entityId);
  }

  public remove(entityId: EntityId): Result<TPayload, EntityNotFoundError> {
    if (!this.payloadById.has(entityId)) {
      return failure({ code: "ENTITY_NOT_FOUND", entityId });
    }

    const payload = this.payloadById.get(entityId) as TPayload;
    this.payloadById.delete(entityId);
    return success(payload);
  }
}
