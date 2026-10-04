'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addToCart, useCart } from '@/lib/marketplace/cart-storage';
import { type MarketplaceItem } from '@/lib/marketplace/product';
import { toast } from '@/lib/toast';
import { initialSelectionOf, purchaseStateOf, type VariantSelection } from '../models/purchase-state';

const ADDED_FEEDBACK_MS = 1600;

// Gère la sélection et l’ajout de la pièce au panier.
export function useProductPurchase(product: MarketplaceItem) {
    const router = useRouter();
    const cart = useCart();
    const [selection, setSelection] = useState<VariantSelection>(() => initialSelectionOf(product));
    const [added, setAdded] = useState(false);
    const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(
        () => () => {
            if (feedbackTimer.current !== null) clearTimeout(feedbackTimer.current);
        },
        [],
    );

    const state = purchaseStateOf(product, selection);
    const variant = state.kind === 'ready' || state.kind === 'sold-out' ? state.variant : null;
    const inCart = cart.some((line) => line.productId === product.id && line.variantId === (variant?.id ?? null));
    const variantId = state.kind === 'ready' ? state.variant.id : null;

    // Ajoute la déclinaison choisie au panier avec une confirmation visuelle.
    const add = useCallback(() => {
        if (!variantId) return;
        addToCart(product.id, variantId, 1);
        setAdded(true);
        toast.success('Ajouté au panier');
        if (feedbackTimer.current !== null) clearTimeout(feedbackTimer.current);
        feedbackTimer.current = setTimeout(() => setAdded(false), ADDED_FEEDBACK_MS);
    }, [product.id, variantId]);

    // Ajoute la déclinaison choisie puis ouvre le panier.
    const buyNow = useCallback(() => {
        if (!variantId) return;
        addToCart(product.id, variantId, 1);
        router.push('/panier');
    }, [product.id, variantId, router]);

    return { selection, setSelection, state, added, inCart, add, buyNow };
}
