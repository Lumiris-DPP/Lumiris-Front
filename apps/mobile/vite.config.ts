import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

const appRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, appRoot, 'VITE_');

    return {
        plugins: [react(), tailwindcss()],
        resolve: {
            alias: {
                '@': appRoot,
            },
        },
        server: {
            // Tauri expects the dev server on a fixed port (devUrl in tauri.conf.json).
            port: 1420,
            strictPort: true,
            watch: {
                ignored: ['**/src-tauri/**', '**/dist/**'],
            },
        },
        build: {
            outDir: 'dist',
        },
        define: {
            'process.env.NEXT_PUBLIC_API_BASE_URL': JSON.stringify(
                env.VITE_NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080',
            ),
            'process.env.NEXT_PUBLIC_APP_NAME': JSON.stringify(env.VITE_NEXT_PUBLIC_APP_NAME ?? 'mobile'),
            'process.env.NEXT_PUBLIC_TAURI': JSON.stringify(env.VITE_NEXT_PUBLIC_TAURI ?? 'false'),
            'process.env.NEXT_PUBLIC_WEB_VITALS_SAMPLE_RATE': JSON.stringify(
                env.VITE_NEXT_PUBLIC_WEB_VITALS_SAMPLE_RATE ?? '1.0',
            ),
            'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
        },
    };
});
