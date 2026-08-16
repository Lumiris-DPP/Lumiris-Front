'use client';

// Hydrate les lignes du panier (localStorage, par productId) avec les données produit RÉELLES du
// catalogue public backend, et calcule les totaux. Utilisé par le panier et l'écran de paiement.
//
// Les fiches sont chargées PAR IDENTIFIANT : le panier ne dépend pas du contenu ni de la taille du
// catalogue, et un produit absent de la réponse est réellement devenu indisponible — ce qui permet
// de le nommer au lieu d'afficher un compteur anonyme.
//
// Le panier peut contenir des pièces de PLUSIEURS ateliers : chacun expédie son propre colis, donc
// chacun facture son port. Les lignes sont regroupées par atelier pour que l'acheteur voie ce
// qu'il paie et combien de colis il recevra — le backend applique exactement le même calcul.

import { useMemo } from 'react';
import type { MarketplaceVariant } from '@lumiris/api-client';
import { useMarketplaceProductsByIds } from '@lumiris/api-client/react';
import { useCart, type CartLine } from './cart-storage';
import { toMarketplaceItem, type MarketplaceItem } from './product';

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

interface CartDetails {
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
    /** Pièces dont le stock ne couvre plus la quantité choisie. */
    overstocked: readonly CartItemDetail[];
    /** Lignes héritées dont la déclinaison n'est plus déterminable : l'acheteur doit rechoisir. */
    needsVariant: readonly UnavailableLine[];
    /** Vrai tant qu'une ligne empêche de payer en l'état. */
    hasBlockingIssue: boolean;
    isLoading: boolean;
}

export interface UnavailableLine {
    productId: string;
    variantId: string | null;
    quantity: number;
    name?: string;
}

export function useCartDetails(): CartDetails {
    const lines = useCart();
    const productIds = useMemo(() => lines.map((line) => line.productId), [lines]);
    const { data, isLoading } = useMarketplaceProductsByIds(productIds);

    return useMemo<CartDetails>(() => {
        const byId = new Map<string, MarketplaceItem>();
        for (const dto of data ?? []) byId.set(dto.id, toMarketplaceItem(dto));

        const items: CartItemDetail[] = [];
        const unavailable: UnavailableLine[] = [];
        const needsVariant: UnavailableLine[] = [];
        for (const line of lines) {
            const product = byId.get(line.productId);
            if (!product) {
                // Tant que la requête n'a pas répondu, on ne déclare rien indisponible : ce serait
                // annoncer une rupture à chaque ouverture du panier.
                if (!isLoading) {
                    unavailable.push({ productId: line.productId, variantId: line.variantId, quantity: line.quantity });
                }
                continue;
            }
            // Une ligne sans déclinaison vient d'un bundle antérieur : elle se résout tant que
            // l'annonce n'en a qu'une. Dès que l'atelier a décliné sa pièce, l'acheteur doit choisir.
            const variant = line.variantId
                ? (product.variants.find((v) => v.id === line.variantId) ?? null)
                : product.variants.length === 1
                  ? (product.variants[0] ?? null)
                  : null;
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
            hasBlockingIssue: unavailable.length > 0 || overstocked.length > 0 || needsVariant.length > 0,
            isLoading,
        };
    }, [lines, data, isLoading]);
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
