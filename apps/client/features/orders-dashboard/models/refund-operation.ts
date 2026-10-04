import type { RefundInput } from '@lumiris/api-client';

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

export function rememberRefundOperation(userId: string, orderId: string, input: RefundInput): void {
    localStorage.setItem(refundOperationKey(userId, orderId), JSON.stringify(input));
}

export function forgetRefundOperation(userId: string, orderId: string): void {
    localStorage.removeItem(refundOperationKey(userId, orderId));
}

function refundOperationKey(userId: string, orderId: string): string {
    return `lumiris.refund:${userId}:${orderId}`;
}
