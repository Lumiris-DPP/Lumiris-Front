import { isApiError } from '@lumiris/api-client';
import type { CartLoadState } from '@/lib/marketplace/cart-model';

type CheckoutScreen =
    | { kind: 'empty' }
    | { kind: 'sign-in' }
    | { kind: 'loading' }
    | { kind: 'load-error' }
    | { kind: 'cart-changed' }
    | { kind: 'refused'; message: string }
    | { kind: 'payment-down' }
    | { kind: 'steps' };

interface CheckoutScreenInput {
    loadState: CartLoadState;

    lineCount: number;
    isAuthenticated: boolean;
    hasBlockingIssue: boolean;

    intentError: unknown;
}

const REFUSAL_CODES: readonly string[] = ['VALIDATION_ERROR', 'NOT_FOUND'];

export function checkoutScreenOf(input: CheckoutScreenInput): CheckoutScreen {
    if (input.loadState === 'ready' && input.lineCount === 0) return { kind: 'empty' };

    if (!input.isAuthenticated) return { kind: 'sign-in' };
    if (input.loadState === 'loading') return { kind: 'loading' };
    if (input.loadState === 'error') return { kind: 'load-error' };
    if (input.hasBlockingIssue) return { kind: 'cart-changed' };
    if (input.intentError) {
        const error = input.intentError;
        return isApiError(error) && REFUSAL_CODES.includes(error.code)
            ? { kind: 'refused', message: error.message }
            : { kind: 'payment-down' };
    }
    return { kind: 'steps' };
}
