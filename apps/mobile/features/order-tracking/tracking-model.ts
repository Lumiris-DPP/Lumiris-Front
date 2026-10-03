import type { OrderResponse } from '@lumiris/api-client';

export type SheetKind = 'return' | 'dispute' | 'message' | 'cancel';

// Formate une date de suivi sans inventer de valeur manquante.
export function formatDate(iso?: string | null): string {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(date);
}

// Distingue une commande absente ou étrangère d'une panne de lecture.
export function isOrderNotFound(error: unknown): boolean {
    return error instanceof Error && 'status' in error && error.status === 404;
}

// Relit les permissions serveur avant l'envoi d'une action déjà ouverte.
export function canSubmitReason(order: OrderResponse, sheet: SheetKind | null): boolean {
    switch (sheet) {
        case 'return':
            return Boolean(order.canRequestReturn);
        case 'dispute':
            return Boolean(order.canOpenDispute) && order.disputeStatus !== 'OPEN';
        case 'cancel':
            return Boolean(order.canCancel);
        case 'message':
            return true;
        default:
            return false;
    }
}
