import { z } from 'zod';

import type { Http } from '../core/http';
import { parseOr } from '../core/validate';
import type { PushSubscriptionPayload } from '../types/push';

const vapidPublicKeySchema = z.object({ publicKey: z.string() });

// Abonnements Web Push de l'utilisateur courant, et clé publique VAPID nécessaire à
// PushManager.subscribe() côté navigateur.
export function pushApi(http: Http) {
    return {
        async vapidPublicKey(): Promise<string> {
            const res = await http.request('/api/push/vapid-public-key');
            return parseOr(vapidPublicKeySchema, res).publicKey;
        },
        subscribe(payload: PushSubscriptionPayload): Promise<void> {
            return http.request<void>('/api/push/subscriptions', { method: 'POST', body: payload, skipJson: true });
        },
        unsubscribe(endpoint: string): Promise<void> {
            return http.request<void>('/api/push/subscriptions', {
                method: 'DELETE',
                query: { endpoint },
                skipJson: true,
            });
        },
    };
}
