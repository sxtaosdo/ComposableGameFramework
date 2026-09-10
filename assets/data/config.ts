import { failure, success, type Result } from "../foundation-core/result.js";

export interface ConfigValidationError {
  readonly code: "INVALID_CONFIG";
  readonly path: string;
  readonly message: string;
}

export type ConfigValidator<T> = (input: unknown) => Result<T, ConfigValidationError>;

export function loadConfig<T>(
  input: unknown,
  validate: ConfigValidator<T>,
): Result<Readonly<T>, ConfigValidationError> {
  const result = validate(input);
  return result.ok ? success(Object.freeze(result.value)) : failure(result.error);
}

