export function getUserTimeZone(): string | undefined {
  try {
    const raw = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (typeof raw !== 'string' || !raw.trim()) return undefined;

    if (typeof Intl.supportedValuesOf === 'function') {
      const supported = Intl.supportedValuesOf('timeZone');
      if (supported.includes(raw)) return raw;

      // Non-canonical alias: attempt round-trip normalization via DateTimeFormat.
      const normalized = Intl.DateTimeFormat(undefined, { timeZone: raw })
        .resolvedOptions().timeZone;
      return supported.includes(normalized) ? normalized : undefined;
    }

    return raw;
  } catch {
    return undefined;
  }
}
