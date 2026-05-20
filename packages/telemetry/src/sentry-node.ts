import * as Sentry from '@sentry/node';

import { LUMIRIS_SAMPLE_RATE_DEV, LUMIRIS_SAMPLE_RATE_PROD } from './constants';
import { redactString } from './redact';
import type { ServiceName, TelemetryEnv } from './types';

export interface InitSentryNodeOptions {
    dsn: string | undefined;
    service: ServiceName;
    env?: TelemetryEnv;
    sampleRate?: number;
    release?: string;
}

let initialized = false;

export function initSentryNode(options: InitSentryNodeOptions): void {
    if (initialized) return;
    if (!options.dsn) return;

    const env = options.env ?? (process.env.NODE_ENV as TelemetryEnv) ?? 'development';
    const isProd = env === 'production';
    const tracesSampleRate = options.sampleRate ?? (isProd ? LUMIRIS_SAMPLE_RATE_PROD : LUMIRIS_SAMPLE_RATE_DEV);

    Sentry.init({
        dsn: options.dsn,
        environment: env,
        release: options.release ?? process.env.npm_package_version,
        tracesSampleRate,
        sendDefaultPii: false,
        initialScope: { tags: { service: options.service } },
        beforeSend(event) {
            if (event.message) event.message = redactString(event.message);
            return event;
        },
    });

    initialized = true;
}

export { Sentry as SentryNode };
