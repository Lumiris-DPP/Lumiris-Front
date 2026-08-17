import { fileURLToPath } from 'node:url';
import path from 'node:path';

/** @typedef {import('next').NextConfig} NextConfig */
/** @typedef {'server' | 'static'} RenderingTarget */
/** @typedef {Exclude<NonNullable<NonNullable<NextConfig['images']>['remotePatterns']>[number], URL>} RemotePattern */

const MONOREPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const SHARED_TRANSPILE_PACKAGES = [
    '@lumiris/ui',
    '@lumiris/core',
    '@lumiris/types',
    '@lumiris/telemetry',
    '@lumiris/api-client',
];

const OTEL_SERVER_PACKAGES = [
    '@opentelemetry/sdk-node',
    '@opentelemetry/auto-instrumentations-node',
    '@opentelemetry/exporter-trace-otlp-http',
    '@opentelemetry/exporter-metrics-otlp-http',
];

/** @type {RemotePattern[]} */
const SHARED_IMAGE_HOSTS = [
    { protocol: 'https', hostname: 'cdn.lumiris.local' },
    { protocol: 'https', hostname: 'cdn.lumiris.eu' },
    { protocol: 'http', hostname: 'localhost', port: '9000' },
];

/**
 * @param {RenderingTarget} target
 * @param {RemotePattern[]} imageHosts
 * @returns {NextConfig}
 */
function renderingTarget(target, imageHosts) {
    if (target === 'static') {
        return {
            output: 'export',
            trailingSlash: true,
            images: { unoptimized: true },
        };
    }
    return {
        output: 'standalone',
        outputFileTracingRoot: MONOREPO_ROOT,
        serverExternalPackages: OTEL_SERVER_PACKAGES,
        images: { remotePatterns: [...SHARED_IMAGE_HOSTS, ...imageHosts] },
    };
}

/**
 * @param {NextConfig & {
 *     target: RenderingTarget,
 *     transpilePackages?: string[],
 *     imageHosts?: RemotePattern[],
 * }} options
 * @returns {NextConfig}
 */
export function createNextConfig({ target, transpilePackages = [], imageHosts = [], experimental = {}, ...appConfig }) {
    return {
        reactStrictMode: true,
        transpilePackages: [...SHARED_TRANSPILE_PACKAGES, ...transpilePackages],
        ...renderingTarget(target, imageHosts),
        ...appConfig,
        experimental: {
            optimizePackageImports: ['lucide-react', '@lumiris/ui'],
            // Next 16.2.4 : turbo-persistence panique en boucle sur index .sst corrompu (static_sorted_file.rs:630).
            turbopackFileSystemCacheForDev: false,
            ...experimental,
        },
    };
}
