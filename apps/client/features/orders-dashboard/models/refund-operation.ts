import type { RefundInput } from '@lumiris/api-client';

// Retrouve une intention dont la réponse peut avoir été perdue.
export function readRefundOperation(userId: string, orderId: string): RefundInput | null {
    const raw = localStorage.getItem(refundOperationKey(userId, orderId));
    if (!raw) return null;
    const input = JSON.parse(raw) as RefundInput;
    if (
        !input ||
        typeof input.operationId !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.operationId) ||
        (input.amountCents !== undefined && (!Number.isSafeInteger(input.amountCents) || input.amountCents <= 0)) ||
        (input.reason !== undefined && typeof input.reason !== 'string')
    ) {
        throw new Error('Intention de remboursement illisible.');
    }
    return input;
}

// Enregistre l'intention avant tout envoi au serveur.
export function rememberRefundOperation(userId: string, orderId: string, input: RefundInput): void {
    localStorage.setItem(refundOperationKey(userId, orderId), JSON.stringify(input));
}

// Libère la prochaine opération après une réponse confirmée.
export function forgetRefundOperation(userId: string, orderId: string): void {
    localStorage.removeItem(refundOperationKey(userId, orderId));
}

// Sépare les intentions par compte et commande.
function refundOperationKey(userId: string, orderId: string): string {
    return `lumiris.refund:${userId}:${orderId}`;
}
