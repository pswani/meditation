import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const backendHost = process.env.MEDITATION_BACKEND_BIND_HOST ?? '127.0.0.1';
const backendPort = process.env.MEDITATION_BACKEND_PORT ?? '8080';
const proxyTarget = `http://${backendHost}:${backendPort}`;
const assetVersionOverride = process.env.MEDITATION_APP_ASSET_VERSION?.trim();

function walkFiles(entryPath: string): string[] {
  const stats = fs.statSync(entryPath);
  if (stats.isFile()) {
    return [entryPath];
  }

  if (!stats.isDirectory()) {
    return [];
  }

  return fs.readdirSync(entryPath)
    .sort((left, right) => left.localeCompare(right))
    .flatMap((child) => walkFiles(path.join(entryPath, child)));
}

function createAppAssetVersion(): string {
  const hash = crypto.createHash('sha256');
  const versionInputs = ['index.html', 'package.json', 'src', 'public']
    .map((candidate) => path.join(rootDir, candidate))
    .filter((candidate) => fs.existsSync(candidate))
    .flatMap((candidate) => walkFiles(candidate));

  for (const filePath of versionInputs) {
    const relativePath = path.relative(rootDir, filePath);
    hash.update(relativePath);
    hash.update('\0');
    hash.update(fs.readFileSync(filePath));
    hash.update('\0');
  }

  return hash.digest('hex').slice(0, 12);
}

const appAssetVersion = assetVersionOverride && assetVersionOverride.length > 0
  ? assetVersionOverride
  : createAppAssetVersion();

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_ASSET_VERSION__: JSON.stringify(appAssetVersion),
  },
  server: {
    proxy: {
      '/api': proxyTarget,
    },
  },
});
