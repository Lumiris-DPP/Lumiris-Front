import { z } from 'zod';
import type { DppScoreInput, IrisGrade, ScoreReason, ScoreResult } from '@lumiris/types';

import type { Http } from '../core/http';
import { parseOr } from '../core/validate';
import {
    dppEventDtoSchema,
    dppFormCreatedDtoSchema,
    dppFormDtoSchema,
    dppFormPublicDtoSchema,
    dppFormSummaryDtoSchema,
    irisScoreDtoSchema,
    type DppEventDto,
    type DppEventPayload,
    type DppFilePart,
    type DppFormCreatedDto,
    type DppFormDto,
    type DppFormPayload,
    type DppFormPublicDto,
    type DppFormSummaryDto,
    type IrisScoreDto,
} from '../types/dpp';

const dppFormSummaryListSchema = z.array(dppFormSummaryDtoSchema);
const dppEventListSchema = z.array(dppEventDtoSchema);

const FIXED_WEIGHTS = { transparency: 0.4, craftsmanship: 0.25, impact: 0.25, repairability: 0.1 } as const;

function toScoreResult(dto: IrisScoreDto): ScoreResult {
    return {
        total: dto.total,
        grade: dto.grade as IrisGrade,
        breakdown: dto.breakdown,
        weights: dto.weights ?? FIXED_WEIGHTS,
        reasons: (dto.reasons ?? []) as ScoreReason[],
    };
}

function buildFormData(payload: DppFormPayload, files?: Partial<Record<DppFilePart, File>>): FormData {
    const form = new FormData();
    form.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    if (files) {
        for (const [part, file] of Object.entries(files)) {
            if (file) form.append(part, file);
        }
    }
    return form;
}

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
        async create(
            payload: DppFormPayload,
            files?: Partial<Record<DppFilePart, File>>,
            draft = false,
        ): Promise<DppFormCreatedDto> {
            const form = buildFormData(payload, files);
            const query = draft ? '?draft=true' : '';
            return parseOr(
                dppFormCreatedDtoSchema,
                await http.request(`/api/dpp-forms${query}`, { method: 'POST', body: form }),
            );
        },
        // Draft-only edit: the backend returns 409 for a published DPP.
        async update(
            id: string,
            payload: DppFormPayload,
            files?: Partial<Record<DppFilePart, File>>,
        ): Promise<DppFormCreatedDto> {
            const form = buildFormData(payload, files);
            return parseOr(
                dppFormCreatedDtoSchema,
                await http.request(`/api/dpp-forms/${id}`, { method: 'PUT', body: form }),
            );
        },
        // Draft-only delete: the backend returns 409 for a published DPP.
        async remove(id: string): Promise<void> {
            await http.request(`/api/dpp-forms/${id}`, { method: 'DELETE' });
        },
        // Finalises a draft: assigns the QR code, freezes the hash, persists the Iris score and anchors it.
        async publish(id: string): Promise<DppFormCreatedDto> {
            return parseOr(
                dppFormCreatedDtoSchema,
                await http.request(`/api/dpp-forms/${id}/publish`, { method: 'POST' }),
            );
        },
        async listEvents(id: string): Promise<DppEventDto[]> {
            return parseOr(dppEventListSchema, await http.request(`/api/dpp-forms/${id}/events`));
        },
        async createEvent(id: string, payload: DppEventPayload): Promise<DppEventDto> {
            return parseOr(
                dppEventDtoSchema,
                await http.request(`/api/dpp-forms/${id}/events`, { method: 'POST', body: payload }),
            );
        },
        async getIrisScore(id: string): Promise<ScoreResult> {
            return toScoreResult(parseOr(irisScoreDtoSchema, await http.request(`/api/dpp-forms/${id}/iris_score`)));
        },
        async computeIrisScore(draft: DppScoreInput): Promise<ScoreResult> {
            return toScoreResult(
                parseOr(
                    irisScoreDtoSchema,
                    await http.request('/api/dpp-forms/compute_iris_score', { method: 'POST', body: draft }),
                ),
            );
        },
        async getPublic(code: string): Promise<DppFormPublicDto> {
            return parseOr(dppFormPublicDtoSchema, await http.request(`/public/dpp_forms/${code}`));
        },
    };
}
