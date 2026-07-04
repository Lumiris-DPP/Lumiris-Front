import type { ScoreResult } from '@lumiris/types';
import type { Http } from './http';

export function dppFormsApi(http: Http) {
    return {
        getIrisScore(id: string): Promise<ScoreResult> {
            return http.request<ScoreResult>(`/api/dpp-forms/${id}/iris_score`);
        },
        computeIrisScore(draft: Record<string, unknown>): Promise<ScoreResult> {
            return http.request<ScoreResult>('/api/dpp-forms/compute_iris_score', { method: 'POST', body: draft });
        },
    };
}
