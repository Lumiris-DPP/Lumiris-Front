import { z } from 'zod';

import type { Http } from '../core/http';
import { parseOr } from '../core/validate';
import {
    notificationPreferenceSchema,
    type NotificationCategory,
    type NotificationPreference,
} from '../types/notification-preferences';

const notificationPreferenceListSchema = z.array(notificationPreferenceSchema);

// Préférences de désabonnement par catégorie (email + push) de l'utilisateur courant.
// GET renvoie toujours les 7 catégories, défaut abonné pour celles jamais modifiées.
export function notificationPreferencesApi(http: Http) {
    return {
        async list(): Promise<NotificationPreference[]> {
            return parseOr(notificationPreferenceListSchema, await http.request('/api/notification-preferences'));
        },
        async update(
            category: NotificationCategory,
            patch: { emailEnabled: boolean; pushEnabled: boolean },
        ): Promise<NotificationPreference> {
            return parseOr(
                notificationPreferenceSchema,
                await http.request(`/api/notification-preferences/${category}`, { method: 'PUT', body: patch }),
            );
        },
    };
}
