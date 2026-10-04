import type { MarketplaceVariant } from '@lumiris/api-client';
import { formatCents } from '@/lib/marketplace/money';
import {
    colorOptionsOf,
    findVariant,
    preparationLabel,
    sizeOptionsOf,
    type MarketplaceItem,
} from '@/lib/marketplace/product';

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

const LOW_STOCK_THRESHOLD = 3;

// Prépare la sélection initiale des déclinaisons du produit.
export function initialSelectionOf(item: MarketplaceItem): VariantSelection {
    const only = item.variants.length === 1 ? item.variants[0] : undefined;
    return { size: only?.sizeLabel?.trim() || null, color: only?.colorLabel?.trim() || null };
}

// Détermine si la sélection est complète et achetable.
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

// Renvoie le message de stock adapté à la sélection.
export function stockHintOf(state: PurchaseState): string | null {
    if (state.kind === 'sold-out') return 'Épuisé';
    if (state.kind === 'ready' && state.variant.stock <= LOW_STOCK_THRESHOLD) {
        return `Plus que ${state.variant.stock} en stock`;
    }
    return null;
}

// Décrit les frais de livraison connus.
export function shippingTermsOf(shippingCents: number | null): string {
    if (shippingCents === null) return 'Expédiée à domicile.';
    if (shippingCents === 0) return 'Offerte — expédiée à domicile.';
    return `${formatCents(shippingCents)} — expédiée à domicile.`;
}

// Résume les frais et le délai de préparation.
export function deliverySummaryOf(item: MarketplaceItem): string {
    const shipping =
        item.shippingCents === null
            ? 'Livraison à domicile'
            : item.shippingCents === 0
              ? 'Livraison offerte'
              : `Livraison ${formatCents(item.shippingCents)}`;
    return [preparationLabel(item.preparationDays), shipping].filter(Boolean).join(' · ');
}
