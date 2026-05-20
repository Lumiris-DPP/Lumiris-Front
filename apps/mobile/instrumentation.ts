export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const [{ initOtel }, { initSentry }, { env }] = await Promise.all([
            import('@lumiris/telemetry/otel-node'),
            import('@lumiris/telemetry/sentry-next'),
            import('./env'),
        ]);
        initOtel({
            service: env.NEXT_PUBLIC_APP_NAME,
            endpoint: env.NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT,
        });
        initSentry({
            dsn: env.NEXT_PUBLIC_SENTRY_DSN || undefined,
            service: env.NEXT_PUBLIC_APP_NAME,
        });
    }
}
