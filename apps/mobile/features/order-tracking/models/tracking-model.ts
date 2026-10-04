import type { OrderResponse } from '@lumiris/api-client';

export type SheetKind = 'return' | 'dispute' | 'message' | 'cancel';

export function isOrderNotFound(error: unknown): boolean {
    return error instanceof Error && 'status' in error && error.status === 404;
}

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
