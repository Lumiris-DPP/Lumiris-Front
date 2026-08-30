import type { Http } from '../core/http';
import type { EmailOutboxResponse, EmailOutboxStatus } from '../types/admin-emails';

export interface AdminEmailListParams {
    status?: EmailOutboxStatus;
    recipientEmail?: string;
    page?: number;
}

// Log d'envoi email complet, réservé aux admins (voir AdminEmailController côté back).
export function adminEmailsApi(http: Http) {
    return {
        list(params: AdminEmailListParams = {}): Promise<EmailOutboxResponse[]> {
            return http.request<EmailOutboxResponse[]>('/api/admin/emails', {
                method: 'GET',
                query: { status: params.status, recipientEmail: params.recipientEmail, page: params.page },
            });
        },
        retry(id: string): Promise<EmailOutboxResponse> {
            return http.request<EmailOutboxResponse>(`/api/admin/emails/${id}/retry`, { method: 'POST' });
        },
    };
}
