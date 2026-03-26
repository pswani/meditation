import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
const DEFAULT_DEV_BACKEND_ORIGIN = 'http://127.0.0.1:8080';
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const configuredApiBaseUrl = env.VITE_API_BASE_URL?.trim();
    const configuredDevBackendOrigin = env.VITE_DEV_BACKEND_ORIGIN?.trim() || DEFAULT_DEV_BACKEND_ORIGIN;
    return {
        plugins: [react()],
        server: {
            host: '0.0.0.0',
            port: 5173,
            allowedHosts: true,
            proxy: configuredApiBaseUrl
                ? undefined
                : {
                    '/api': {
                        target: configuredDevBackendOrigin,
                        changeOrigin: true,
                    },
                },
        },
        preview: {
            host: '0.0.0.0',
            port: 4173,
            allowedHosts: true,
        },
    };
});
