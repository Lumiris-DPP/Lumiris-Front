// Ce que la fiche produit permet d'acheter : déclinaison choisie, état du bouton, indice de stock et
// lignes de livraison. Calcul pur, testé avec Bun ; la fiche ne fait que l'afficher.

import type { MarketplaceVariant } from '@lumiris/api-client';
import { formatCents } from '@/lib/marketplace/money';
import {
    colorOptionsOf,
    findVariant,
    preparationLabel,
    sizeOptionsOf,
    type MarketplaceItem,
} from '@/lib/marketplace/product';

// Un seul axe d'état, typé : c'est lui qui pilote le libellé du bouton, son activation et l'indice
// de stock. Deux booléens auraient laissé passer des combinaisons impossibles.
export type PurchaseState =
    | { kind: 'ready'; variant: MarketplaceVariant }
    | { kind: 'sold-out'; variant: MarketplaceVariant }
    | { kind: 'needs-size' }
    | { kind: 'needs-color' }
    | { kind: 'unavailable' };

export interface VariantSelection {
    size: string | null;
    color: string | null;
}

// Seuil d'affichage de « Plus que N en stock » sur la fiche, repris tel quel de l'écran d'origine.
const LOW_STOCK_THRESHOLD = 3;

/** Présélectionne la déclinaison unique : rien ne change pour une pièce sans axe. */
export function initialSelectionOf(item: MarketplaceItem): VariantSelection {
    const only = item.variants.length === 1 ? item.variants[0] : undefined;
    return { size: only?.sizeLabel?.trim() || null, color: only?.colorLabel?.trim() || null };
}

/** Déduit de la sélection ce que le bouton d'achat peut faire. */
export function purchaseStateOf(item: MarketplaceItem, selection: VariantSelection): PurchaseState {
    const sizes = sizeOptionsOf(item);
    const colors = colorOptionsOf(item);
    if (sizes.length > 0 && !selection.size) return { kind: 'needs-size' };
    if (colors.length > 0 && !selection.color) return { kind: 'needs-color' };

    const variant = findVariant(item, selection.size, selection.color);
    if (!variant) return { kind: 'unavailable' };
    return variant.stock > 0 ? { kind: 'ready', variant } : { kind: 'sold-out', variant };
}

export const PURCHASE_CTA_LABEL = {
    ready: 'Acheter',
    'sold-out': 'Épuisée',
    'needs-size': 'Choisis une taille',
    'needs-color': 'Choisis une couleur',
    unavailable: 'Indisponible',
} satisfies Record<PurchaseState['kind'], string>;

/** Indice de stock de la déclinaison choisie, ou null quand il n'y a rien à signaler. */
export function stockHintOf(state: PurchaseState): string | null {
    if (state.kind === 'sold-out') return 'Épuisé';
    if (state.kind === 'ready' && state.variant.stock <= LOW_STOCK_THRESHOLD) {
        return `Plus que ${state.variant.stock} en stock`;
    }
    return null;
}

/** Ligne « Livraison » du bloc des conditions : le port inconnu ne s'invente pas, il se tait. */
export function shippingTermsOf(shippingCents: number | null): string {
    if (shippingCents === null) return 'Expédiée à domicile.';
    if (shippingCents === 0) return 'Offerte — expédiée à domicile.';
    return `${formatCents(shippingCents)} — expédiée à domicile.`;
}

/** Résumé délai et port sous le prix, dans la barre d'achat. */
export function deliverySummaryOf(item: MarketplaceItem): string {
    const shipping =
        item.shippingCents === null
            ? 'Livraison à domicile'
            : item.shippingCents === 0
              ? 'Livraison offerte'
              : `Livraison ${formatCents(item.shippingCents)}`;
    return [preparationLabel(item.preparationDays), shipping].filter(Boolean).join(' · ');
}
