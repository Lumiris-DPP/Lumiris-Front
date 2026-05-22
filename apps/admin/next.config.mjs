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
    redirects() {
        return [
            { source: '/iris', destination: '/passeports', permanent: false },
            { source: '/iris/:id', destination: '/passeports?id=:id', permanent: false },
            { source: '/retoucheurs', destination: '/reseau?tab=retoucheurs', permanent: false },
            { source: '/retoucheurs/:path*', destination: '/reseau?tab=retoucheurs', permanent: false },
            { source: '/vision-users', destination: '/reseau?tab=users', permanent: false },
            { source: '/vision-users/:path*', destination: '/reseau?tab=users', permanent: false },
            { source: '/billing', destination: '/revenus?tab=subscriptions', permanent: false },
            { source: '/billing/:path*', destination: '/revenus?tab=subscriptions', permanent: false },
            { source: '/affiliation', destination: '/revenus?tab=affiliation', permanent: false },
            { source: '/affiliation/:path*', destination: '/revenus?tab=affiliation', permanent: false },
            { source: '/gouvernance', destination: '/audit', permanent: false },
            { source: '/gouvernance/:path*', destination: '/audit', permanent: false },
        ];
    },
};

export default nextConfig;
