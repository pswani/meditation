import type { MeditationType } from './timer';

export interface MediaAssetMetadata {
  readonly id: string;
  readonly label: string;
  readonly meditationType: MeditationType | null;
  readonly filePath: string;
  readonly relativePath: string;
  readonly durationSeconds: number;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly updatedAt: string;
}
