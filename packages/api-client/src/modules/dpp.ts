import { z } from 'zod';

import type { Http } from '../core/http';
import { parseOr } from '../core/validate';
import {
    dppFormDtoSchema,
    dppFormSummaryDtoSchema,
    type DppFormDto,
    type DppFormPayload,
    type DppFormSummaryDto,
} from '../types/dpp';

const dppFormSummaryListSchema = z.array(dppFormSummaryDtoSchema);

export function dppApi(http: Http) {
    return {
        async list(): Promise<DppFormSummaryDto[]> {
            // GET /api/dpp-forms is paginated (Spring `Page`): unwrap `.content`.
            // Stay tolerant of a bare-array response in case the contract changes.
            const res = await http.request<unknown>('/api/dpp-forms');
            const items = Array.isArray(res) ? res : ((res as { content?: unknown[] })?.content ?? []);
            return parseOr(dppFormSummaryListSchema, items);
        },
        async get(id: string): Promise<DppFormDto> {
            return parseOr(dppFormDtoSchema, await http.request(`/api/dpp-forms/${id}`));
        },
        async create(payload: DppFormPayload): Promise<DppFormDto> {
            return parseOr(dppFormDtoSchema, await http.request('/api/dpp-forms', { method: 'POST', body: payload }));
        },
    };
}
