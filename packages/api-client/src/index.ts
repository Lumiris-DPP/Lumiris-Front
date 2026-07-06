import { createHttp, type HttpOptions } from './http';
import { authApi } from './auth';
import { telemetryApi } from './telemetry';
import { storageApi } from './storage';
import { artisansApi } from './artisans';
import { adminArtisansApi } from './admin-artisans';

export type ClientOptions = HttpOptions;

export function createClient(opts: ClientOptions) {
    const http = createHttp(opts);
    return {
        auth: authApi(http),
        telemetry: telemetryApi(http),
        storage: storageApi(http),
        artisans: artisansApi(http),
        adminArtisans: adminArtisansApi(http),
    };
}

export type LumirisClient = ReturnType<typeof createClient>;

export { CACHE_TIMES, type QueryPreset } from './cache';
export { createKeys, type QueryKeys } from './keys';

export type {
    LoginRequest,
    RegisterRequest,
    RefreshRequest,
    AuthResponse,
    LoginResponse,
    RegisterResponse,
} from './auth';
export type { RefreshedTokens } from './http';
export type { ArtisanProfileResponse, ArtisanRegisterRequest, ArtisanStatus } from './artisans';
export type { RejectArtisanRequest } from './admin-artisans';
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
