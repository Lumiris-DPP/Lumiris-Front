import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter, ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';
import {
    SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
    SEMRESATTRS_SERVICE_NAME,
    SEMRESATTRS_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

import { LUMIRIS_SAMPLE_RATE_DEV, LUMIRIS_SAMPLE_RATE_PROD } from './constants';
import type { ServiceName, TelemetryEnv } from './types';

export interface InitOtelOptions {
    service: ServiceName;
    env?: TelemetryEnv;
    sampleRate?: number;
    endpoint?: string;
    serviceVersion?: string;
}

let sdk: NodeSDK | null = null;

export function initOtel(options: InitOtelOptions): NodeSDK | null {
    if (sdk) return sdk;

    const env = options.env ?? (process.env.NODE_ENV as TelemetryEnv) ?? 'development';
    const isProd = env === 'production';
    const envRate = Number(process.env.NEXT_PUBLIC_WEB_VITALS_SAMPLE_RATE ?? '');
    const sampleRate =
        options.sampleRate ??
        (Number.isFinite(envRate) ? envRate : isProd ? LUMIRIS_SAMPLE_RATE_PROD : LUMIRIS_SAMPLE_RATE_DEV);

    const endpoint =
        options.endpoint ??
        process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??
        process.env.NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT ??
        'http://localhost:4318';

    if (process.env.OTEL_LOG_LEVEL === 'debug') {
        diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
    }

    const traceExporter = isProd
        ? new OTLPTraceExporter({ url: `${endpoint}/v1/traces` })
        : process.env.OTEL_DEV_CONSOLE === '1'
          ? new ConsoleSpanExporter()
          : undefined;

    const metricReader = isProd
        ? new PeriodicExportingMetricReader({
              exporter: new OTLPMetricExporter({ url: `${endpoint}/v1/metrics` }),
              exportIntervalMillis: 15_000,
          })
        : undefined;

    const resource = new Resource({
        [SEMRESATTRS_SERVICE_NAME]: options.service,
        [SEMRESATTRS_SERVICE_VERSION]: options.serviceVersion ?? process.env.npm_package_version ?? '0.0.0',
        [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: env,
    });

    sdk = new NodeSDK({
        resource,
        traceExporter,
        metricReader,
        sampler: new ParentBasedSampler({ root: new TraceIdRatioBasedSampler(sampleRate) }),
        instrumentations: [
            getNodeAutoInstrumentations({
                '@opentelemetry/instrumentation-fs': { enabled: false },
                '@opentelemetry/instrumentation-http': {
                    ignoreIncomingRequestHook: (req) => {
                        const url = req.url ?? '';
                        return (
                            url.startsWith('/_next') ||
                            url.startsWith('/static') ||
                            url === '/favicon.ico' ||
                            url === '/healthz' ||
                            url === '/metrics'
                        );
                    },
                },
            }),
        ],
    });

    sdk.start();

    const shutdown = () => {
        sdk?.shutdown()
            .catch((err: unknown) => console.error('[otel] shutdown error', err))
            .finally(() => process.exit(0));
    };
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);

    return sdk;
}
