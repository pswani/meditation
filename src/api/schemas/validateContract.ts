import type { ZodType, ZodTypeDef } from 'zod';

export function validateApiContract<T>(
  schema: ZodType<T, ZodTypeDef, unknown>,
  raw: unknown,
  context: string
): void {
  const result = schema.safeParse(raw);
  if (!result.success) {
    console.error(`[API contract mismatch] ${context}`, result.error.flatten());
    if (import.meta.env.DEV) {
      throw new Error(`API contract mismatch in ${context}: ${result.error.message}`);
    }
  }
}
