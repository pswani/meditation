import { z } from 'zod';

export const sessionLogSchema = z.object({
  id: z.string(),
  startedAt: z.string(),
  endedAt: z.string(),
  meditationType: z.string(),
  timerMode: z.enum(['fixed', 'open-ended']).optional(),
  intendedDurationSeconds: z.number().nullable(),
  completedDurationSeconds: z.number(),
  status: z.enum(['completed', 'ended early']),
  source: z.enum(['auto log', 'manual log']),
  startSound: z.string(),
  endSound: z.string(),
  intervalEnabled: z.boolean(),
  intervalMinutes: z.number(),
  intervalSound: z.string(),
  playlistId: z.string().nullable().optional(),
  playlistName: z.string().nullable().optional(),
  playlistRunId: z.string().nullable().optional(),
  playlistRunStartedAt: z.string().nullable().optional(),
  playlistItemPosition: z.number().nullable().optional(),
  playlistItemCount: z.number().nullable().optional(),
  customPlayId: z.string().nullable().optional(),
  customPlayName: z.string().nullable().optional(),
  customPlayRecordingLabel: z.string().nullable().optional(),
});

export type SessionLogApiShape = z.infer<typeof sessionLogSchema>;
