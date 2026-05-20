// Same Next codebase serves the web port and the Tauri static export, switched via BUILD_TARGET=tauri.
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isTauri = process.env.BUILD_TARGET === 'tauri';

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: [
        '@lumiris/ui',
        '@lumiris/scoring-ui',
        '@lumiris/core',
        '@lumiris/types',
        '@lumiris/mock-data',
        '@lumiris/telemetry',
        '@lumiris/api-client',
    ],
    serverExternalPackages: [
        '@opentelemetry/sdk-node',
        '@opentelemetry/auto-instrumentations-node',
        '@opentelemetry/exporter-trace-otlp-http',
        '@opentelemetry/exporter-metrics-otlp-http',
    ],
    experimental: {
        optimizePackageImports: ['lucide-react', '@lumiris/ui'],
    },
    ...(isTauri && {
        output: 'export',
        distDir: 'out',
        images: { unoptimized: true },
        trailingSlash: true,
    }),
    ...(!isTauri && {
        output: 'standalone',
        outputFileTracingRoot: path.resolve(__dirname, '../..'),
        images: {
            remotePatterns: [
                { protocol: 'https', hostname: 'cdn.lumiris.local' },
                { protocol: 'https', hostname: 'cdn.lumiris.eu' },
                { protocol: 'http', hostname: 'localhost', port: '9000' },
            ],
        },
    }),
};

export default nextConfig;
