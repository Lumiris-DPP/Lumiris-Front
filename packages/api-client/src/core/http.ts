import { NetworkError, TimeoutError, createApiError, isApiError } from './errors';

export interface RefreshedTokens {
    token: string;
    refreshToken: string;
}

export interface HttpOptions {
    baseUrl: string;
    getToken?: () => string | undefined;
    /** Enables transparent refresh-and-retry on 401/403: provide alongside onTokensRefreshed. */
    getRefreshToken?: () => string | undefined;
    onTokensRefreshed?: (tokens: RefreshedTokens) => void;
    onUnauthorized?: () => void;
    timeoutMs?: number;
    maxRetries?: number;
}

export interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    query?: Record<string, string | number | boolean | undefined>;
    headers?: Record<string, string>;
    skipJson?: boolean;
    retries?: number;
    signal?: AbortSignal;
}

export interface Http {
    request<T>(path: string, opts?: RequestOptions): Promise<T>;
    baseUrl: string;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RETRIES = 2;
const RETRY_INITIAL_DELAY_MS = 500;
const RETRY_BACKOFF_MULTIPLIER = 2;
const RETRY_MAX_DELAY_MS = 8_000;
const RETRY_JITTER_MS = 100;

function calculateRetryDelay(attempt: number): number {
    const exponential = RETRY_INITIAL_DELAY_MS * Math.pow(RETRY_BACKOFF_MULTIPLIER, attempt);
    const capped = Math.min(exponential, RETRY_MAX_DELAY_MS);
    return capped + Math.random() * RETRY_JITTER_MS;
}

function shouldRetry(err: unknown): boolean {
    if (!isApiError(err)) return false;
    return err.code === 'SERVER_ERROR' || err.code === 'RATE_LIMITED';
}

export function createHttp(options: HttpOptions): Http {
    const baseUrl = options.baseUrl.replace(/\/$/, '');
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const defaultMaxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;

    // Concurrent 401/403s (e.g. several queries in flight when the access token expires)
    // dedupe onto a single in-flight refresh instead of each firing their own.
    let refreshPromise: Promise<boolean> | null = null;

    async function refreshAccessToken(): Promise<boolean> {
        if (refreshPromise) return refreshPromise;
        refreshPromise = (async () => {
            const rt = options.getRefreshToken?.();
            if (!rt) return false;
            try {
                const res = await fetch(`${baseUrl}/api/auth/refresh`, {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ refreshToken: rt }),
                });
                if (!res.ok) return false;
                const tokens = (await res.json()) as RefreshedTokens;
                options.onTokensRefreshed?.(tokens);
                return true;
            } catch {
                return false;
            }
        })();
        try {
            return await refreshPromise;
        } finally {
            refreshPromise = null;
        }
    }

    async function executeOnce<T>(
        url: string,
        init: RequestInit,
        skipJson: boolean,
        externalSignal?: AbortSignal,
    ): Promise<T> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const onExternalAbort = () => controller.abort();
        if (externalSignal) {
            if (externalSignal.aborted) controller.abort();
            else externalSignal.addEventListener('abort', onExternalAbort, { once: true });
        }

        let response: Response;
        try {
            response = await fetch(url, { ...init, signal: controller.signal });
        } catch (err) {
            if ((err as Error)?.name === 'AbortError') {
                if (externalSignal?.aborted) throw err;
                throw new TimeoutError(`fetch timeout after ${timeoutMs}ms`);
            }
            throw new NetworkError(`fetch failed: ${(err as Error).message ?? 'unknown'}`, err);
        } finally {
            clearTimeout(timer);
            externalSignal?.removeEventListener('abort', onExternalAbort);
        }

        if (!response.ok) {
            const body = await safeJson(response);
            const retryAfterHeader = response.headers.get('retry-after');
            const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined;
            throw createApiError(
                response.status,
                extractMessage(body) ?? `HTTP ${response.status}`,
                body,
                Number.isFinite(retryAfter) ? retryAfter : undefined,
            );
        }

        if (skipJson || response.status === 204) return undefined as T;
        return (await response.json()) as T;
    }

    async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
        const url = buildUrl(baseUrl, path, opts.query);
        const method = opts.method ?? (opts.body !== undefined ? 'POST' : 'GET');
        const skipJson = opts.skipJson ?? false;
        const maxRetries = opts.retries ?? (method === 'GET' ? defaultMaxRetries : 0);
        const isFormData = typeof FormData !== 'undefined' && opts.body instanceof FormData;

        function buildInit(): RequestInit {
            const headers: Record<string, string> = {
                accept: 'application/json',
                ...(opts.body !== undefined && !isFormData ? { 'content-type': 'application/json' } : {}),
                ...(opts.headers ?? {}),
            };
            const token = options.getToken?.();
            if (token) headers['authorization'] = `Bearer ${token}`;
            return {
                method,
                headers,
                body:
                    opts.body === undefined
                        ? undefined
                        : isFormData
                          ? (opts.body as FormData)
                          : JSON.stringify(opts.body),
            };
        }

        async function attempt(): Promise<T> {
            let lastError: unknown;
            for (let i = 0; i <= maxRetries; i++) {
                try {
                    return await executeOnce<T>(url, buildInit(), skipJson, opts.signal);
                } catch (err) {
                    lastError = err;
                    if (i >= maxRetries || !shouldRetry(err)) break;
                    const delay =
                        isApiError(err) && err.code === 'RATE_LIMITED' && typeof err.retryAfter === 'number'
                            ? err.retryAfter * 1000
                            : calculateRetryDelay(i);
                    await sleep(delay);
                }
            }
            throw lastError;
        }

        try {
            return await attempt();
        } catch (err) {
            const isAuthFailure = isApiError(err) && (err.code === 'AUTH_ERROR' || err.code === 'FORBIDDEN');
            if (isAuthFailure && options.getRefreshToken) {
                if (await refreshAccessToken()) return await attempt();
                options.onUnauthorized?.();
            } else if (isAuthFailure) {
                options.onUnauthorized?.();
            }
            throw err;
        }
    }

    return { request, baseUrl };
}

function buildUrl(baseUrl: string, path: string, query?: RequestOptions['query']): string {
    const p = path.startsWith('/') ? path : `/${path}`;
    const url = `${baseUrl}${p}`;
    if (!query) return url;
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
        if (v !== undefined) params.set(k, String(v));
    }
    const qs = params.toString();
    return qs ? `${url}?${qs}` : url;
}

async function safeJson(response: Response): Promise<unknown> {
    try {
        const text = await response.text();
        if (!text) return undefined;
        return JSON.parse(text);
    } catch {
        return undefined;
    }
}

function extractMessage(body: unknown): string | undefined {
    if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>;
        if (typeof b.message === 'string') return b.message;
        if (typeof b.error === 'string') return b.error;
        if (typeof b.detail === 'string') return b.detail;
    }
    return undefined;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
