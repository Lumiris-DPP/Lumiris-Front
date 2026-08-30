export type EmailOutboxStatus = 'PENDING' | 'SENT' | 'DEAD';

export interface EmailOutboxResponse {
    id: string;
    recipientEmail: string;
    subject: string;
    template: string;
    status: EmailOutboxStatus;
    attempts: number;
    maxAttempts: number;
    lastError: string | null;
    variables: Record<string, unknown>;
    createdAt: string;
    sentAt: string | null;
}
