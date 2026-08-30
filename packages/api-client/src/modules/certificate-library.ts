import { z } from 'zod';

import type { Http } from '../core/http';
import { parseOr } from '../core/validate';
import {
    certificateLibraryItemSchema,
    type CertificateLibraryItem,
    type CertificateLibraryType,
} from '../types/certificate-library';

const certificateLibraryListSchema = z.array(certificateLibraryItemSchema);

export function certificateLibraryApi(http: Http) {
    return {
        async list(): Promise<CertificateLibraryItem[]> {
            return parseOr(certificateLibraryListSchema, await http.request('/api/certificate-library'));
        },
        async upload(file: File, type: CertificateLibraryType): Promise<CertificateLibraryItem> {
            const body = new FormData();
            body.append('file', file);
            return parseOr(
                certificateLibraryItemSchema,
                await http.request('/api/certificate-library', { method: 'POST', body, query: { type } }),
            );
        },
        async remove(id: string): Promise<void> {
            await http.request(`/api/certificate-library/${id}`, { method: 'DELETE' });
        },
    };
}
