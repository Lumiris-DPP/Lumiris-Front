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
            return parseOr(dppFormSummaryListSchema, await http.request('/api/dpp-forms'));
        },
        async get(id: string): Promise<DppFormDto> {
            return parseOr(dppFormDtoSchema, await http.request(`/api/dpp-forms/${id}`));
        },
        async create(payload: DppFormPayload): Promise<DppFormDto> {
            return parseOr(dppFormDtoSchema, await http.request('/api/dpp-forms', { method: 'POST', body: payload }));
        },
    };
}
