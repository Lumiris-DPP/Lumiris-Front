import { z } from 'zod';

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

// Fichier téléversé, identifié pour être ensuite rattaché (message de commande, litige…).
const uploadedFileSchema = z.object({
    id: z.string(),
    originalFilename: z.string().nullish(),
    contentType: z.string().nullish(),
    sizeBytes: z.number().nullish(),
});
export type UploadedFile = z.infer<typeof uploadedFileSchema>;

export function storageApi(http: Http) {
    return {
        // Téléversement direct (multipart). Renvoie l'identifiant à joindre au formulaire appelant,
        // ce qui permet de prévisualiser la pièce avant de valider quoi que ce soit.
        async upload(file: File): Promise<UploadedFile> {
            const body = new FormData();
            body.append('file', file);
            return parseOr(uploadedFileSchema, await http.request('/api/files', { method: 'POST', body }));
        },
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
