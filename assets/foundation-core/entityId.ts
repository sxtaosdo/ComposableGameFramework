import { failure, success, type Result } from "./result.js";

declare const entityIdBrand: unique symbol;

export type EntityId = string & { readonly [entityIdBrand]: true };

export interface InvalidEntityIdError {
  readonly code: "INVALID_ENTITY_ID";
  readonly value: string;
}

export function createEntityId(value: string): Result<EntityId, InvalidEntityIdError> {
  if (value.length === 0 || value.trim() !== value) {
    return failure({ code: "INVALID_ENTITY_ID", value });
  }

  return success(value as EntityId);
}
