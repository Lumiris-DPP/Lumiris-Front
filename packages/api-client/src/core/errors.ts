export type ApiErrorCode =
    | 'VALIDATION_ERROR'
    | 'AUTH_ERROR'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'RATE_LIMITED'
    | 'SERVER_ERROR'
    | 'NETWORK_ERROR'
    | 'TIMEOUT'
    | 'UNKNOWN';

export interface ApiErrorShape {
    code: ApiErrorCode;
    status: number;
    message: string;
    timestamp: number;
    fields?: Record<string, string[]>;
    retryAfter?: number;
    body?: unknown;
}

export class ApiError extends Error implements ApiErrorShape {
    readonly code: ApiErrorCode;
    readonly status: number;
    readonly timestamp: number;
    readonly fields?: Record<string, string[]>;
    readonly retryAfter?: number;
    readonly body?: unknown;

    constructor(shape: ApiErrorShape) {
        super(shape.message);
        this.name = 'ApiError';
        this.code = shape.code;
        this.status = shape.status;
        this.timestamp = shape.timestamp;
        if (shape.fields !== undefined) this.fields = shape.fields;
        if (shape.retryAfter !== undefined) this.retryAfter = shape.retryAfter;
        if (shape.body !== undefined) this.body = shape.body;
    }
}

export class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized', body?: unknown) {
        super({ code: 'AUTH_ERROR', status: 401, message, timestamp: Date.now(), body });
        this.name = 'UnauthorizedError';
    }
}

export class NetworkError extends ApiError {
    constructor(message: string, cause?: unknown) {
        super({ code: 'NETWORK_ERROR', status: 0, message, timestamp: Date.now(), body: cause });
        this.name = 'NetworkError';
    }
}

export class TimeoutError extends ApiError {
    constructor(message = 'Request timed out') {
        super({ code: 'TIMEOUT', status: 0, message, timestamp: Date.now() });
        this.name = 'TimeoutError';
    }
}

function mapStatusToCode(status: number): ApiErrorCode {
    if (status === 400 || status === 422) return 'VALIDATION_ERROR';
    if (status === 401) return 'AUTH_ERROR';
    if (status === 403) return 'FORBIDDEN';
    if (status === 404) return 'NOT_FOUND';
    if (status === 429) return 'RATE_LIMITED';
    if (status >= 500) return 'SERVER_ERROR';
    return 'UNKNOWN';
}

function extractFieldErrors(body: unknown): Record<string, string[]> | undefined {
    if (!body || typeof body !== 'object') return undefined;
    const b = body as Record<string, unknown>;
    if (Array.isArray(b.errors)) {
        const fields: Record<string, string[]> = {};
        for (const e of b.errors) {
            if (e && typeof e === 'object' && 'field' in e && typeof e.field === 'string') {
                const field = e.field;
                const msg = typeof e.message === 'string' ? e.message : String(e.message ?? '');
                const existing = fields[field] ?? [];
                existing.push(msg);
                fields[field] = existing;
            }
        }
        return Object.keys(fields).length > 0 ? fields : undefined;
    }
    return undefined;
}

export function createApiError(status: number, message: string, body?: unknown, retryAfter?: number): ApiError {
    const code = mapStatusToCode(status);
    const shape: ApiErrorShape = {
        code,
        status,
        message,
        timestamp: Date.now(),
        ...(body !== undefined ? { body } : {}),
    };
    if (code === 'VALIDATION_ERROR') {
        const fields = extractFieldErrors(body);
        if (fields) shape.fields = fields;
    }
    if (code === 'RATE_LIMITED' && retryAfter !== undefined) {
        shape.retryAfter = retryAfter;
    }
    if (code === 'AUTH_ERROR') return new UnauthorizedError(message, body);
    return new ApiError(shape);
}

export function isApiError(err: unknown): err is ApiError {
    return err instanceof ApiError;
}
