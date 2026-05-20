import type { Http } from './http';

export type StorageBucket = 'uploads' | 'assets' | 'backups';

export interface UploadUrlRequest {
    bucket: StorageBucket;
    key: string;
    contentType?: string;
}

export interface UploadUrlResponse {
    url: string;
    headers: Record<string, string>;
    expiresInSeconds: number;
}

export interface DownloadUrlRequest {
    bucket: StorageBucket;
    key: string;
}

export interface DownloadUrlResponse {
    url: string;
    expiresInSeconds: number;
}

export function storageApi(http: Http) {
    return {
        uploadUrl(req: UploadUrlRequest): Promise<UploadUrlResponse> {
            return http.request<UploadUrlResponse>('/api/storage/upload-url', { method: 'POST', body: req });
        },
        downloadUrl(req: DownloadUrlRequest): Promise<DownloadUrlResponse> {
            return http.request<DownloadUrlResponse>('/api/storage/download-url', {
                method: 'GET',
                query: { bucket: req.bucket, key: req.key },
            });
        },
    };
}
