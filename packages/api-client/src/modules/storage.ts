import type { Http } from '../core/http';
import { parseOr } from '../core/validate';
import {
    downloadUrlResponseSchema,
    uploadUrlResponseSchema,
    type DownloadUrlRequest,
    type DownloadUrlResponse,
    type UploadUrlRequest,
    type UploadUrlResponse,
} from '../types/storage';

export function storageApi(http: Http) {
    return {
        async uploadUrl(req: UploadUrlRequest): Promise<UploadUrlResponse> {
            return parseOr(
                uploadUrlResponseSchema,
                await http.request('/api/storage/upload-url', { method: 'POST', body: req }),
            );
        },
        async downloadUrl(req: DownloadUrlRequest): Promise<DownloadUrlResponse> {
            return parseOr(
                downloadUrlResponseSchema,
                await http.request('/api/storage/download-url', {
                    method: 'GET',
                    query: { bucket: req.bucket, key: req.key },
                }),
            );
        },
    };
}
