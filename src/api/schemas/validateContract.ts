import type { ZodType } from 'zod';
import { reportError } from '../../utils/errorSink';

export function validateApiContract<T>(
  schema: ZodType<T>,
  raw: unknown,
  context: string
): void {
  const result = schema.safeParse(raw);
  if (!result.success) {
    reportError('[API contract mismatch]', { context, issues: result.error.flatten() });
    if (import.meta.env.DEV) {
      throw new Error(`API contract mismatch in ${context}: ${result.error.message}`);
    }
  }
}
