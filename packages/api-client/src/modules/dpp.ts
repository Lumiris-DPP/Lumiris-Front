import { z } from 'zod';

import type { Http } from '../core/http';
import { parseOr } from '../core/validate';
import {
    dppFormCreatedDtoSchema,
    dppFormDtoSchema,
    dppFormSummaryDtoSchema,
    type DppFilePart,
    type DppFormCreatedDto,
    type DppFormDto,
    type DppFormPayload,
    type DppFormSummaryDto,
} from '../types/dpp';

const dppFormSummaryListSchema = z.array(dppFormSummaryDtoSchema);

export function dppApi(http: Http) {
    return {
        async list(): Promise<DppFormSummaryDto[]> {
            // GET /api/dpp-forms may return a bare array or a Spring `Page` — tolerate both.
            const res = await http.request<unknown>('/api/dpp-forms');
            const items = Array.isArray(res) ? res : ((res as { content?: unknown[] })?.content ?? []);
            return parseOr(dppFormSummaryListSchema, items);
        },
        async get(id: string): Promise<DppFormDto> {
            return parseOr(dppFormDtoSchema, await http.request(`/api/dpp-forms/${id}`));
        },
        async create(payload: DppFormPayload, files?: Partial<Record<DppFilePart, File>>): Promise<DppFormCreatedDto> {
            const form = new FormData();
            form.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
            if (files) {
                for (const [part, file] of Object.entries(files)) {
                    if (file) form.append(part, file);
                }
            }
            return parseOr(
                dppFormCreatedDtoSchema,
                await http.request('/api/dpp-forms', { method: 'POST', body: form }),
            );
        },
    };
}
