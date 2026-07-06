export { ApiProvider, type ApiProviderProps } from './api-provider';
export { QueryProvider, type QueryProviderProps } from './provider';
export { useApiClient } from './client-context';

export { useListQuery, useDetailQuery, useStaticQuery, useRealtimeQuery } from './queries';
export { createSubResourceMutations, type EntityApi, type SubResourceKeys, type IdField } from './mutations';

export { authKeys, useLogin, useRegister, useMe } from './auth';
export { artisanKeys, useArtisanMe, useArtisanRegister, useSignDeclaration } from './artisans';
export { adminArtisanKeys, useAdminArtisansList, useVerifyArtisan, useRejectArtisan } from './admin-artisans';
export { storageKeys, useUploadUrl, useDownloadUrl } from './storage';
export { useWebVital } from './telemetry';

export { ApiError, NetworkError, TimeoutError, UnauthorizedError, isApiError, type ApiErrorCode } from '../errors';
