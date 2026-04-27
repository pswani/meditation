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
  // Exclude the generated offline-sw.js (produced by inject-sw-version plugin from the template).
  const generatedSwPath = path.join(rootDir, 'public/offline-sw.js');
  const versionInputs = ['index.html', 'package.json', 'src', 'public']
    .map((candidate) => path.join(rootDir, candidate))
    .filter((candidate) => fs.existsSync(candidate))
    .flatMap((candidate) => walkFiles(candidate))
    .filter((filePath) => filePath !== generatedSwPath);

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

function generateServiceWorker(): void {
  const templatePath = path.join(rootDir, 'public/offline-sw.template.js');
  const outputPath = path.join(rootDir, 'public/offline-sw.js');
  const template = fs.readFileSync(templatePath, 'utf8');
  const output = template.replace('__SW_CACHE_VERSION__', JSON.stringify(appAssetVersion));
  fs.writeFileSync(outputPath, output);
}

// Generate offline-sw.js immediately so it exists for dev server static serving.
generateServiceWorker();

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'inject-sw-version',
      buildStart() {
        generateServiceWorker();
      },
    },
  ],
  define: {
    __APP_ASSET_VERSION__: JSON.stringify(appAssetVersion),
  },
  server: {
    proxy: {
      '/api': proxyTarget,
    },
  },
});
