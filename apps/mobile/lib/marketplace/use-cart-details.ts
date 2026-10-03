'use client';

// Hydrate les lignes du panier (localStorage, par productId) avec les données produit RÉELLES du
// catalogue public backend. Utilisé par le panier et l'écran de paiement ; le calcul lui-même vit
// dans cart-model.
//
// Les fiches sont chargées PAR IDENTIFIANT : le panier ne dépend pas du contenu ni de la taille du
// catalogue, et un produit absent d'une réponse réussie est réellement devenu indisponible — ce qui
// permet de le nommer au lieu d'afficher un compteur anonyme.

import { useEffect, useMemo } from 'react';
import { useMarketplaceProductsByIds, useMyOrders } from '@lumiris/api-client/react';
import { useUser } from '../auth/use-user';
import { buildCartDetails, purchasesToSettle, type CartDetails, type CartLine, type CartLoadState } from './cart-model';
import { forgetPurchase, pendingPurchaseIds, settlePurchase, useCart } from './cart-storage';
import { toMarketplaceItem } from './product';

/** Détail du panier et relance de la lecture du catalogue quand elle a échoué. */
export function useCartDetails(): CartDetails & { retry: () => void } {
    const lines = useCart();
    useSettlePaidPurchases(lines);
    const productIds = useMemo(() => lines.map((line) => line.productId), [lines]);
    const { data, isError, refetch } = useMarketplaceProductsByIds(productIds);
    const products = useMemo(() => data?.map(toMarketplaceItem), [data]);

    // Une lecture réussie fait foi, même si un rafraîchissement ultérieur échoue ; sans elle, une
    // panne reste une panne et non un panier vidé de ses pièces.
    const loadState: CartLoadState = lines.length === 0 || products ? 'ready' : isError ? 'error' : 'loading';

    return useMemo(
        () => ({
            ...buildCartDetails(lines, products, loadState),
            retry: () => void refetch(),
        }),
        [lines, products, loadState, refetch],
    );
}

// Un paiement peut être confirmé après la fin de l'attente de l'écran de confirmation : tant qu'un
// paiement préparé reste sans sort connu, la liste des commandes dit s'il a été payé (lignes retirées
// du panier) ou annulé (mémo oublié, panier intact).
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
