import { z } from 'zod';

import type { Http } from '../core/http';
import { parseOr } from '../core/validate';
import { notificationSchema, type Notification } from '../types/notifications';

const notificationListSchema = z.array(notificationSchema);
const unreadCountSchema = z.object({ count: z.number() });

// Notifications in-app du destinataire courant (mêmes routes pour ATELIER et VISION).
export function notificationsApi(http: Http) {
    return {
        async list(): Promise<Notification[]> {
            return parseOr(notificationListSchema, await http.request('/api/notifications'));
        },
        async unreadCount(): Promise<number> {
            const res = await http.request('/api/notifications/unread-count');
            return parseOr(unreadCountSchema, res).count;
        },
        markRead(id: string): Promise<void> {
            return http.request<void>(`/api/notifications/${id}/read`, { method: 'POST', skipJson: true });
        },
        markAllRead(): Promise<void> {
            return http.request<void>('/api/notifications/read-all', { method: 'POST', skipJson: true });
        },
    };
}
