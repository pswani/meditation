export interface MediaAssetMetadata {
  readonly id: string;
  readonly label: string;
  readonly filePath: string;
  readonly durationSeconds: number;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly updatedAt: string;
}
