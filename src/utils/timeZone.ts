export function getUserTimeZone(): string | undefined {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return typeof timeZone === 'string' && timeZone.trim().length > 0 ? timeZone : undefined;
  } catch {
    return undefined;
  }
}
