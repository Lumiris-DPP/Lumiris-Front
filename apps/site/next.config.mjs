import { fileURLToPath } from 'node:url';
import path from 'node:path';
import createMDX from '@next/mdx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withMDX = createMDX({
    extension: /\.mdx?$/,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: 'standalone',
    outputFileTracingRoot: path.resolve(__dirname, '../..'),
    pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
    transpilePackages: [
        '@lumiris/ui',
        '@lumiris/core',
        '@lumiris/types',
        '@lumiris/telemetry',
        '@lumiris/api-client',
        'react-leaflet',
        '@react-leaflet/core',
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
            { protocol: 'https', hostname: 'placehold.co' },
            { protocol: 'https', hostname: 'cdn.lumiris.local' },
            { protocol: 'https', hostname: 'cdn.lumiris.eu' },
            { protocol: 'http', hostname: 'localhost', port: '9000' },
        ],
    },
};

export default withMDX(nextConfig);
