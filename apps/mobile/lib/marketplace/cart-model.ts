// Calculs purs du panier : rapprochement des lignes locales avec les fiches du catalogue, totaux par
// colis et retrait des lignes payées. Ni stockage ni React ici : le module se teste avec Bun.
//
// Le panier peut contenir des pièces de PLUSIEURS ateliers : chacun expédie son propre colis, donc
// chacun facture son port. Les lignes sont regroupées par atelier pour que l'acheteur voie ce qu'il
// paie et combien de colis il recevra — le backend applique exactement le même calcul.

import type { MarketplaceVariant, OrderStatus } from '@lumiris/api-client';
import type { MarketplaceItem } from './product';

export interface CartLine {
    productId: string;
    /** Déclinaison achetée. `null` sur les lignes créées avant les déclinaisons. */
    variantId: string | null;
    quantity: number;
    addedAt: string;
}

/** Ligne réservée par un PaymentIntent : ce qui sera payé, donc ce qui quittera le panier. */
export interface PurchasedLine {
    productId: string;
    variantId: string | null;
    quantity: number;
}

export interface CartItemDetail {
    product: MarketplaceItem;
    /** Déclinaison achetée — porte le stock réel de la ligne. */
    variant: MarketplaceVariant;
    quantity: number;
    lineTotalCents: number;
    /** Quantité réellement disponible, si elle est devenue inférieure à celle du panier. */
    availableQuantity: number;
}

export interface CartShipment {
    artisanProfileId: string;
    artisanName: string;
    items: CartItemDetail[];
    itemsTotalCents: number;
    /** Port du colis = le plus élevé des ports des pièces de cet atelier (une seule expédition). */
    shippingCents: number;
}

export interface UnavailableLine {
    productId: string;
    variantId: string | null;
    quantity: number;
    name?: string;
}

/**
 * État de la lecture des fiches du panier. Une lecture en cours ou en panne ne prouve rien : elle
 * ne vide pas le panier et ne déclare aucune pièce indisponible, mais elle bloque le paiement.
 */
export type CartLoadState = 'loading' | 'error' | 'ready';

export interface CartDetails {
    lines: readonly CartLine[];
    items: readonly CartItemDetail[];
    /** Un colis par atelier — l'unité que l'acheteur reçoit et que le vendeur expédie. */
    shipments: readonly CartShipment[];
    subtotalCents: number;
    shippingCents: number;
    totalCents: number;
    count: number;
    /** Pièces qui ne sont plus en vente, nommées pour que l'acheteur sache lesquelles retirer. */
    unavailable: readonly UnavailableLine[];
    /**
     * Pièces dont le stock PUBLIC ne couvre plus la quantité choisie. Simple avertissement : ce stock
     * exclut ce que l'acheteur a lui-même réservé à une tentative précédente, que le serveur compte.
     */
    overstocked: readonly CartItemDetail[];
    /** Lignes héritées dont la déclinaison n'est plus déterminable : l'acheteur doit rechoisir. */
    needsVariant: readonly UnavailableLine[];
    loadState: CartLoadState;
    /**
     * Vrai tant que la lecture du catalogue, une pièce retirée ou une taille à choisir empêche de payer.
     * Le stock n'en fait pas partie : le serveur le tranche, réservation de l'acheteur comprise.
     */
    hasBlockingIssue: boolean;
}

/** Clé d'une ligne : produit et déclinaison, la quantité n'en fait pas partie. */
export function cartLineKey(productId: string, variantId: string | null): string {
    return `${productId}:${variantId ?? ''}`;
}

/**
 * Rapproche les lignes locales des fiches renvoyées par le catalogue. Seule une réponse réussie
 * permet de dire qu'une pièce absente n'est plus en vente ; sinon les lignes restent en attente.
 */
export function buildCartDetails(
    lines: readonly CartLine[],
    products: readonly MarketplaceItem[] | undefined,
    loadState: CartLoadState,
): CartDetails {
    const byId = new Map<string, MarketplaceItem>();
    for (const product of products ?? []) byId.set(product.id, product);

    const items: CartItemDetail[] = [];
    const unavailable: UnavailableLine[] = [];
    const needsVariant: UnavailableLine[] = [];
    for (const line of lines) {
        const product = byId.get(line.productId);
        if (!product) {
            if (loadState === 'ready') {
                unavailable.push({ productId: line.productId, variantId: line.variantId, quantity: line.quantity });
            }
            continue;
        }
        const variant = resolveVariant(product, line.variantId);
        if (!variant) {
            needsVariant.push({
                productId: line.productId,
                variantId: line.variantId,
                quantity: line.quantity,
                name: product.name,
            });
            continue;
        }
        items.push({
            product,
            variant,
            quantity: line.quantity,
            lineTotalCents: product.priceCents * line.quantity,
            availableQuantity: variant.stock,
        });
    }

    const shipments = groupByArtisan(items);
    const subtotalCents = items.reduce((sum, it) => sum + it.lineTotalCents, 0);
    const shippingCents = shipments.reduce((sum, s) => sum + s.shippingCents, 0);
    const overstocked = items.filter((it) => it.quantity > it.availableQuantity);

    return {
        lines,
        items,
        shipments,
        subtotalCents,
        shippingCents,
        totalCents: subtotalCents + shippingCents,
        count: items.reduce((sum, it) => sum + it.quantity, 0),
        unavailable,
        overstocked,
        needsVariant,
        loadState,
        hasBlockingIssue: loadState !== 'ready' || unavailable.length > 0 || needsVariant.length > 0,
    };
}

/**
 * Retire du panier les quantités réellement payées, ligne à ligne : ce que l'acheteur a ajouté
 * depuis (autre pièce, ou la même pièce en plus) reste dans le panier.
 */
export function subtractPurchase(lines: readonly CartLine[], purchased: readonly PurchasedLine[]): CartLine[] {
    const paid = new Map<string, number>();
    for (const line of purchased) {
        const key = cartLineKey(line.productId, line.variantId);
        paid.set(key, (paid.get(key) ?? 0) + line.quantity);
    }
    const remaining: CartLine[] = [];
    for (const line of lines) {
        const key = cartLineKey(line.productId, line.variantId);
        const toRemove = Math.min(paid.get(key) ?? 0, line.quantity);
        paid.set(key, (paid.get(key) ?? 0) - toRemove);
        if (line.quantity > toRemove) remaining.push({ ...line, quantity: line.quantity - toRemove });
    }
    return remaining;
}

/** Une commande dans un de ces états a été payée et n'est pas défaite : ses lignes ont quitté le panier. */
export function isPaidOrderStatus(status: OrderStatus): boolean {
    return status !== 'PENDING' && status !== 'CANCELLED' && status !== 'REFUNDED';
}

/**
 * Tri des paiements mémorisés d'après la liste des commandes : payés (lignes à retirer du panier),
 * annulés ou remboursés (mémo à oublier, panier intact) ; les autres attendent leur confirmation.
 */
export function purchasesToSettle(
    paymentIntentIds: readonly string[],
    orders: ReadonlyArray<{ paymentIntentId?: string | null; status: OrderStatus }>,
): { paid: string[]; dropped: string[] } {
    const paid: string[] = [];
    const dropped: string[] = [];
    for (const id of paymentIntentIds) {
        const statuses = orders.filter((order) => order.paymentIntentId === id).map((order) => order.status);
        if (statuses.length === 0 || statuses.includes('PENDING')) continue;
        (statuses.some(isPaidOrderStatus) ? paid : dropped).push(id);
    }
    return { paid, dropped };
}

// Une ligne sans déclinaison vient d'un bundle antérieur : elle se résout tant que l'annonce n'en
// a qu'une. Dès que l'atelier a décliné sa pièce, l'acheteur doit choisir.
function resolveVariant(product: MarketplaceItem, variantId: string | null): MarketplaceVariant | null {
    if (variantId) return product.variants.find((v) => v.id === variantId) ?? null;
    return product.variants.length === 1 ? (product.variants[0] ?? null) : null;
}

// Ordre d'ajout préservé : le panier ne se réorganise pas sous les doigts de l'acheteur.
function groupByArtisan(items: readonly CartItemDetail[]): CartShipment[] {
    const byArtisan = new Map<string, CartShipment>();
    for (const item of items) {
        const key = item.product.artisanProfileId;
        const shipment = byArtisan.get(key);
        if (shipment) {
            shipment.items.push(item);
            shipment.itemsTotalCents += item.lineTotalCents;
            shipment.shippingCents = Math.max(shipment.shippingCents, item.product.shippingCents ?? 0);
            continue;
        }
        byArtisan.set(key, {
            artisanProfileId: key,
            artisanName: item.product.artisanName,
            items: [item],
            itemsTotalCents: item.lineTotalCents,
            shippingCents: item.product.shippingCents ?? 0,
        });
    }
    return [...byArtisan.values()];
}
