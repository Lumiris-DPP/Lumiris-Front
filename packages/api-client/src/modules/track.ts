import type { Http } from '../core/http';
import type { AffiliateTrackInput } from '../types/marketplace';

// Tracking d'affiliation. Fire-and-forget : POST /public/track/affiliate, 202 sans
// corps, aucun retry — ne doit jamais bloquer la redirection vers l'atelier.
export function trackApi(http: Http) {
    return {
        affiliate(input: AffiliateTrackInput): Promise<void> {
            return http.request<void>('/public/track/affiliate', {
                method: 'POST',
                body: input,
                skipJson: true,
                retries: 0,
            });
        },
    };
}
