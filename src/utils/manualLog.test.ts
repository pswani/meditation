import { describe, expect, it } from 'vitest';
import { buildManualLogEntry, validateManualLogInput } from './manualLog';

describe('manual log helpers', () => {
  it('validates required manual log fields', () => {
    const result = validateManualLogInput({
      durationMinutes: 0,
      meditationType: '',
      sessionTimestamp: '',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.durationMinutes).toMatch(/greater than 0/i);
    expect(result.errors.meditationType).toMatch(/required/i);
    expect(result.errors.sessionTimestamp).toMatch(/required/i);
  });

  it('rejects malformed session timestamp values', () => {
    const result = validateManualLogInput({
      durationMinutes: 20,
      meditationType: 'Vipassana',
      sessionTimestamp: 'not-a-timestamp',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.sessionTimestamp).toMatch(/valid date and time/i);
  });

  it('builds a manual log entry using session end timestamp semantics', () => {
    const log = buildManualLogEntry(
      {
        durationMinutes: 30,
        meditationType: 'Tratak',
        sessionTimestamp: '2026-03-23T07:00',
      },
      new Date('2026-03-23T10:00:00.000Z')
    );

    expect(log.source).toBe('manual log');
    expect(log.status).toBe('completed');
    expect(log.completedDurationSeconds).toBe(1800);
    expect(log.endedAt).toBe(new Date('2026-03-23T07:00').toISOString());
    expect(log.startedAt).toBe(new Date('2026-03-23T06:30').toISOString());
  });
});
