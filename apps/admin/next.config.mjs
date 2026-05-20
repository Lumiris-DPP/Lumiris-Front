import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: 'standalone',
    outputFileTracingRoot: path.resolve(__dirname, '../..'),
    transpilePackages: [
        '@lumiris/ui',
        '@lumiris/scoring-ui',
        '@lumiris/core',
        '@lumiris/types',
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
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'cdn.lumiris.local' },
            { protocol: 'https', hostname: 'cdn.lumiris.eu' },
            { protocol: 'http', hostname: 'localhost', port: '9000' },
        ],
    },
};

export default nextConfig;
