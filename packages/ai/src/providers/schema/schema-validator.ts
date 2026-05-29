export interface ValidationResult<T> {
  success: boolean;
  value?: T;
  errors: string[];
}

export interface SchemaValidator<T> {
  readonly id: string;
  validate(value: unknown): ValidationResult<T>;
  parse(value: unknown): T;
}

export function createValidator<T>(
  id: string,
  validateFn: (value: unknown) => ValidationResult<T>,
): SchemaValidator<T> {
  return {
    id,
    validate: validateFn,
    parse(value: unknown): T {
      const result = validateFn(value);
      if (!result.success || result.value === undefined) {
        throw new Error(result.errors.join("; ") || `Invalid ${id} schema`);
      }
      return result.value;
    },
  };
}
