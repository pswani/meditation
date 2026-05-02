import { z } from 'zod';

export const timerSettingsSchema = z.object({
  id: z.string().optional(),
  timerMode: z.enum(['fixed', 'open-ended']).optional(),
  durationMinutes: z.number().nullable().optional(),
  lastFixedDurationMinutes: z.number().optional(),
  meditationType: z.string(),
  startSound: z.string(),
  endSound: z.string(),
  intervalEnabled: z.boolean(),
  intervalMinutes: z.number(),
  intervalSound: z.string(),
  updatedAt: z.string().optional(),
});

export type TimerSettingsApiShape = z.infer<typeof timerSettingsSchema>;
