export interface EnvSpecBase<TRequired extends boolean> {
    required?: TRequired;
    description?: string;
}

export type StringSpec<R extends boolean> = EnvSpecBase<R> & {
    kind: 'string';
    default?: string;
};

export type NumberSpec<R extends boolean> = EnvSpecBase<R> & {
    kind: 'number';
    default?: number;
    min?: number;
    max?: number;
};

export type BooleanSpec<R extends boolean> = EnvSpecBase<R> & {
    kind: 'boolean';
    default?: boolean;
};

export type EnumSpec<R extends boolean, V extends string> = EnvSpecBase<R> & {
    kind: 'enum';
    values: readonly V[];
    default?: V;
};

export type EnvSpec = StringSpec<boolean> | NumberSpec<boolean> | BooleanSpec<boolean> | EnumSpec<boolean, string>;

export type EnvSchema = Record<string, EnvSpec>;

export type NextAppName = 'admin' | 'site' | 'client' | 'mobile';

export const NEXT_APP_BASE_ENV_SCHEMA = {
    NEXT_PUBLIC_API_BASE_URL: {
        kind: 'string',
        required: false,
        default: 'http://localhost:8080',
        description: 'Base URL du backend Spring Boot',
    },
    NEXT_PUBLIC_WEB_VITALS_SAMPLE_RATE: {
        kind: 'number',
        required: false,
        min: 0,
        max: 1,
        default: 1.0,
        description: 'Sample rate des Web Vitals (1.0 = 100%, prod=0.1)',
    },
    NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT: {
        kind: 'string',
        required: false,
        default: 'http://localhost:4318',
        description: 'Endpoint OTLP HTTP pour traces+metrics',
    },
    NEXT_PUBLIC_APP_NAME: {
        kind: 'enum',
        values: ['admin', 'site', 'client', 'mobile'] as const,
        required: true,
        description: "Identifiant de l'app (tagging telemetry, doit matcher le DTO backend)",
    },
    NEXT_PUBLIC_SENTRY_DSN: {
        kind: 'string',
        required: false,
        default: '',
        description: 'Sentry DSN, vide en dev local (init skip silencieux)',
    },
    NODE_ENV: {
        kind: 'enum',
        values: ['development', 'production', 'test'] as const,
        required: false,
        default: 'development',
    },
} as const satisfies EnvSchema;

/**
 * Build a per-app env schema with NEXT_PUBLIC_APP_NAME pre-defaulted.
 * Pass `extra` to merge in app-specific keys (e.g. NEXT_PUBLIC_TAURI for mobile).
 */
export function makeNextAppEnvSchema<E extends EnvSchema>(appName: NextAppName, extra?: E) {
    return {
        ...NEXT_APP_BASE_ENV_SCHEMA,
        NEXT_PUBLIC_APP_NAME: {
            ...NEXT_APP_BASE_ENV_SCHEMA.NEXT_PUBLIC_APP_NAME,
            required: false as const,
            default: appName,
        },
        ...(extra ?? ({} as E)),
    };
}

type HasDefault<S> = S extends { default: infer D } ? ([D] extends [undefined] ? false : true) : false;

type Resolve<S extends EnvSpec> =
    S extends StringSpec<infer R>
        ? R extends true
            ? string
            : HasDefault<S> extends true
              ? string
              : string | undefined
        : S extends NumberSpec<infer R>
          ? R extends true
              ? number
              : HasDefault<S> extends true
                ? number
                : number | undefined
          : S extends BooleanSpec<infer R>
            ? R extends true
                ? boolean
                : HasDefault<S> extends true
                  ? boolean
                  : boolean | undefined
            : S extends EnumSpec<infer R, infer V>
              ? R extends true
                  ? V
                  : HasDefault<S> extends true
                    ? V
                    : V | undefined
              : never;

export type ParsedEnv<S extends EnvSchema> = {
    [K in keyof S]: Resolve<S[K]>;
};

export class EnvValidationError extends Error {
    constructor(public readonly issues: readonly string[]) {
        super(`Invalid environment:\n  - ${issues.join('\n  - ')}`);
        this.name = 'EnvValidationError';
    }
}

const TRUTHY = new Set(['1', 'true', 'yes', 'on']);
const FALSY = new Set(['0', 'false', 'no', 'off', '']);

export type EnvSource = Record<string, string | undefined>;

export function parseEnv<S extends EnvSchema>(schema: S, source: EnvSource = readProcessEnv()): ParsedEnv<S> {
    const out = {} as Record<string, unknown>;
    const issues: string[] = [];

    for (const key of Object.keys(schema)) {
        const spec = schema[key];
        if (!spec) continue;
        const raw = source[key];
        const result = parseOne(key, spec, raw);
        if ('error' in result) {
            issues.push(result.error);
        } else {
            out[key] = result.value;
        }
    }

    if (issues.length > 0) throw new EnvValidationError(issues);
    return out as ParsedEnv<S>;
}

function parseOne(key: string, spec: EnvSpec, raw: string | undefined): { value: unknown } | { error: string } {
    const present = raw !== undefined && raw !== '';

    if (!present) {
        if ('default' in spec && spec.default !== undefined) return { value: spec.default };
        if (spec.required) return { error: `${key} is required but missing` };
        return { value: undefined };
    }

    switch (spec.kind) {
        case 'string':
            return { value: raw };

        case 'number': {
            const n = Number(raw);
            if (!Number.isFinite(n)) return { error: `${key} is not a finite number (got "${raw}")` };
            if (spec.min !== undefined && n < spec.min) return { error: `${key}=${n} is below min ${spec.min}` };
            if (spec.max !== undefined && n > spec.max) return { error: `${key}=${n} is above max ${spec.max}` };
            return { value: n };
        }

        case 'boolean': {
            const v = raw.trim().toLowerCase();
            if (TRUTHY.has(v)) return { value: true };
            if (FALSY.has(v)) return { value: false };
            return { error: `${key} is not a boolean (got "${raw}")` };
        }

        case 'enum': {
            if ((spec.values as readonly string[]).includes(raw)) return { value: raw };
            return {
                error: `${key} must be one of [${spec.values.join(', ')}] (got "${raw}")`,
            };
        }
    }
}

function readProcessEnv(): EnvSource {
    const g = globalThis as { process?: { env?: Record<string, string | undefined> } };
    return g.process?.env ?? {};
}
