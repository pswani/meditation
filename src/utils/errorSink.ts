type ErrorContext = Record<string, unknown>;

export function reportError(message: string, context?: ErrorContext): void {
  const entry = { level: 'error', message, ...context, ts: new Date().toISOString() };
  console.error(JSON.stringify(entry));
}

export function reportWarning(message: string, context?: ErrorContext): void {
  const entry = { level: 'warn', message, ...context, ts: new Date().toISOString() };
  console.warn(JSON.stringify(entry));
}
