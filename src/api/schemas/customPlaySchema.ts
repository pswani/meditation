import { z } from 'zod';

export const customPlaySchema = z.object({
  id: z.string(),
  name: z.string(),
  meditationType: z.string(),
  durationMinutes: z.number().positive(),
  startSound: z.string(),
  endSound: z.string(),
  mediaAssetId: z.string().nullable().optional(),
  recordingLabel: z.string().nullable().optional(),
  favorite: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CustomPlayApiShape = z.infer<typeof customPlaySchema>;
