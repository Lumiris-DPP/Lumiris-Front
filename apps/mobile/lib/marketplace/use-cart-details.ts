'use client';

// Hydrate les lignes du panier (localStorage, par productId) avec les données produit
// RÉELLES du catalogue public backend, et calcule les totaux. Utilisé par le panier et
// l'écran de paiement. Les frais de port réels sont ajoutés par le backend au PaymentIntent
// (ils ne figurent pas dans le catalogue public) : le total exact s'affiche à l'étape carte.

import { useMemo } from 'react';
import { useMarketplaceSearch } from '@lumiris/api-client/react';
import { useCart, type CartLine } from './cart-storage';
import { toMarketplaceItem, type MarketplaceItem } from './product';

export interface CartItemDetail {
    product: MarketplaceItem;
    quantity: number;
    lineTotalCents: number;
}

interface CartDetails {
    lines: readonly CartLine[];
    items: readonly CartItemDetail[];
    subtotalCents: number;
    count: number;
    /** Nombre d'ateliers distincts — doit valoir 1 pour un paiement unique (Connect). */
    sellerCount: number;
    /** Lignes dont le produit n'existe plus / n'est plus publié. */
    missingCount: number;
    isLoading: boolean;
}

export function useCartDetails(): CartDetails {
    const lines = useCart();
    const { data, isLoading } = useMarketplaceSearch();

    return useMemo<CartDetails>(() => {
        const byId = new Map<string, MarketplaceItem>();
        for (const dto of data?.items ?? []) byId.set(dto.id, toMarketplaceItem(dto));

        const items: CartItemDetail[] = [];
        let missing = 0;
        for (const line of lines) {
            const product = byId.get(line.productId);
            if (!product) {
                missing += 1;
                continue;
            }
            items.push({
                product,
                quantity: line.quantity,
                lineTotalCents: product.priceCents * line.quantity,
            });
        }

        const subtotalCents = items.reduce((sum, it) => sum + it.lineTotalCents, 0);
        const count = items.reduce((sum, it) => sum + it.quantity, 0);
        const sellerCount = new Set(items.map((it) => it.product.artisanProfileId)).size;

        return { lines, items, subtotalCents, count, sellerCount, missingCount: missing, isLoading };
    }, [lines, data, isLoading]);
}
