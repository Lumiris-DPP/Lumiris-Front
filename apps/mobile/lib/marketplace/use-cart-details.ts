'use client';

import { useEffect, useMemo } from 'react';
import { useMarketplaceProductsByIds, useMyOrders } from '@lumiris/api-client/react';
import { useUser } from '../auth/use-user';
import { buildCartDetails, purchasesToSettle, type CartDetails, type CartLine, type CartLoadState } from './cart-model';
import { forgetPurchase, pendingPurchaseIds, resolveStoredCartLines, settlePurchase, useCart } from './cart-storage';
import { toMarketplaceItem } from './product';

export function useCartDetails(): CartDetails & { retry: () => void } {
    const lines = useCart();
    const productIds = useMemo(() => lines.map((line) => line.productId), [lines]);
    const { data, isError, refetch } = useMarketplaceProductsByIds(productIds);
    const products = useMemo(() => data?.map(toMarketplaceItem), [data]);
    useEffect(() => {
        if (products) resolveStoredCartLines(products);
    }, [products, lines]);
    useSettlePaidPurchases(lines);

    const loadState: CartLoadState = lines.length === 0 || products ? 'ready' : isError ? 'error' : 'loading';

    return useMemo(
        () => ({
            ...buildCartDetails(lines, products, loadState),
            retry: () => void refetch(),
        }),
        [lines, products, loadState, refetch],
    );
}

function useSettlePaidPurchases(lines: readonly CartLine[]): void {
    const { isAuthenticated } = useUser();
    const awaiting = useMemo(() => lines.length > 0 && pendingPurchaseIds().length > 0, [lines]);
    const { data: orders } = useMyOrders({ enabled: isAuthenticated && awaiting });

    useEffect(() => {
        if (!orders) return;
        const { paid, dropped } = purchasesToSettle(pendingPurchaseIds(), orders);
        paid.forEach(settlePurchase);
        dropped.forEach(forgetPurchase);
    }, [orders]);
}
