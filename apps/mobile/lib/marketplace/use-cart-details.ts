'use client';

// Hydrate les lignes du panier (localStorage, par productId) avec les données produit RÉELLES du
// catalogue public backend. Utilisé par le panier et l'écran de paiement ; le calcul lui-même vit
// dans cart-model.
//
// Les fiches sont chargées PAR IDENTIFIANT : le panier ne dépend pas du contenu ni de la taille du
// catalogue, et un produit absent d'une réponse réussie est réellement devenu indisponible — ce qui
// permet de le nommer au lieu d'afficher un compteur anonyme.

import { useMemo } from 'react';
import { useMarketplaceProductsByIds } from '@lumiris/api-client/react';
import { buildCartDetails, type CartDetails, type CartLoadState } from './cart-model';
import { useCart } from './cart-storage';
import { toMarketplaceItem } from './product';

/** Détail du panier et relance de la lecture du catalogue quand elle a échoué. */
export function useCartDetails(): CartDetails & { retry: () => void } {
    const lines = useCart();
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
