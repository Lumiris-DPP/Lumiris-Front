import { createHttp, type HttpOptions } from './http';
import { authApi } from './auth';
import { telemetryApi } from './telemetry';
import { storageApi } from './storage';

export type ClientOptions = HttpOptions;

export function createClient(opts: ClientOptions) {
    const http = createHttp(opts);
    return {
        auth: authApi(http),
        telemetry: telemetryApi(http),
        storage: storageApi(http),
    };
}

export type LumirisClient = ReturnType<typeof createClient>;

export { CACHE_TIMES, type QueryPreset } from './cache';
export { createKeys, type QueryKeys } from './keys';

export type { LoginRequest, LoginResponse } from './auth';
export type { AppName, WebVitalName, WebVitalPayload, WebVitalRating } from './telemetry';
export type {
    DownloadUrlRequest,
    DownloadUrlResponse,
    StorageBucket,
    UploadUrlRequest,
    UploadUrlResponse,
} from './storage';
export {
    ApiError,
    NetworkError,
    TimeoutError,
    UnauthorizedError,
    createApiError,
    isApiError,
    type ApiErrorCode,
    type ApiErrorShape,
} from './errors';
