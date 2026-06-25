'use client';

// Logique d'achat mockée (Stripe simulé). Aucune vraie transaction.
// Effet de bord : chaque pièce achetée rejoint la Garde-Robe avec
// un document "Facture" et un document "Garantie" chiffrés et rattachés.

import { mockArtisanById } from '@lumiris/mock-data';
import type { Passport } from '@lumiris/types';
import { encryptFile } from '../documents/crypto';
import { addToWardrobe, attachDocumentToPassport, type WardrobeDocument } from '../wardrobe-storage';
import type { CartLine } from './cart-storage';
import { clearCart } from './cart-storage';
import { getListing, getMarketplaceItem } from './listings';
import { appendOrder, generateOrderNumber, type Order, type OrderLine, type ShippingAddress } from './order-storage';

export interface CartItemDetail {
    passportId: string;
    passport: Passport;
    reference: string;
    artisanName: string;
    unitPrice: number;
    quantity: number;
    shippingFee: number;
    shippingDays: number;
    lineTotal: number;
}

export interface CartTotals {
    items: readonly CartItemDetail[];
    subtotal: number;
    shipping: number;
    total: number;
    count: number;
}

const now = () => new Date();

/** Hydrate les lignes du panier avec les données passeport/annonce et calcule les totaux. */
export function computeCartTotals(lines: readonly CartLine[]): CartTotals {
    const items: CartItemDetail[] = [];
    for (const line of lines) {
        const market = getMarketplaceItem(line.passportId, now());
        const listing = getListing(line.passportId);
        if (!market || !listing) continue;
        const unitPrice = market.passport.garment.retailPrice;
        items.push({
            passportId: line.passportId,
            passport: market.passport,
            reference: market.passport.garment.reference,
            artisanName: market.artisanName,
            unitPrice,
            quantity: line.quantity,
            shippingFee: listing.shippingFee,
            shippingDays: listing.shippingDays,
            lineTotal: unitPrice * line.quantity,
        });
    }
    const subtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
    // Frais de port : on retient le port le plus élevé parmi les ateliers (mock simple).
    const shipping = items.reduce((max, it) => Math.max(max, it.shippingFee), 0);
    const count = items.reduce((sum, it) => sum + it.quantity, 0);
    return { items, subtotal, shipping, total: subtotal + shipping, count };
}

function buildInvoiceFile(order: Order): File {
    const lines = order.lines
        .map((l) => `  ${l.quantity} x ${l.reference} (${l.artisanName}) — ${l.unitPrice} EUR`)
        .join('\n');
    const body = [
        'LUMIRIS — FACTURE',
        `Numero de commande : ${order.number}`,
        `Date : ${new Date(order.createdAt).toLocaleDateString('fr-FR')}`,
        '',
        `Livraison : ${order.address.fullName}`,
        `${order.address.line1}, ${order.address.postalCode} ${order.address.city}`,
        '',
        'Articles :',
        lines,
        '',
        `Sous-total : ${order.subtotal} EUR`,
        `Frais de port : ${order.shipping} EUR`,
        `Total paye : ${order.total} EUR`,
        `Paiement : carte ****${order.cardLast4} (Stripe — simule)`,
    ].join('\n');
    return new File([body], `facture-${order.number}.txt`, { type: 'image/png' });
}

function buildWarrantyFile(passport: Passport, orderNumber: string): File {
    const artisan = mockArtisanById(passport.artisanId);
    const body = [
        'LUMIRIS — CERTIFICAT DE GARANTIE',
        `Commande : ${orderNumber}`,
        `Piece : ${passport.garment.reference}`,
        `Atelier : ${artisan?.atelierName ?? 'Atelier independant'}`,
        `Duree de garantie : ${passport.warranty.durationMonths} mois`,
        '',
        passport.warranty.terms,
        passport.warranty.repairabilityCommitment ?? '',
    ].join('\n');
    return new File([body], `garantie-${passport.garment.reference}.txt`, { type: 'image/png' });
}

export interface CheckoutInput {
    address: ShippingAddress;
    cardLast4: string;
    userId: string | null;
}

/**
 * Valide la commande (mock) : crée l'Order, vide le panier, ajoute chaque pièce
 * à la Garde-Robe et y rattache une Facture + une Garantie chiffrées.
 * Le MIME des documents générés est forcé à un type accepté par le coffre-fort.
 */
export async function placeOrder(lines: readonly CartLine[], input: CheckoutInput): Promise<Order> {
    const totals = computeCartTotals(lines);
    const createdAt = now();
    const orderLines: OrderLine[] = totals.items.map((it) => ({
        passportId: it.passportId,
        reference: it.reference,
        artisanName: it.artisanName,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
    }));

    const order: Order = {
        id: crypto.randomUUID(),
        number: generateOrderNumber(createdAt),
        createdAt: createdAt.toISOString(),
        lines: orderLines,
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        total: totals.total,
        address: input.address,
        cardLast4: input.cardLast4,
    };

    // Facture globale (rattachée à chaque pièce de la commande).
    const invoiceFile = buildInvoiceFile(order);
    const invoiceBlob = await encryptFile(invoiceFile, input.userId);

    for (const it of totals.items) {
        addToWardrobe(it.passportId);

        const invoiceDoc: WardrobeDocument = {
            id: crypto.randomUUID(),
            kind: 'invoice',
            fileName: `Facture ${order.number}`,
            mimeType: 'image/png',
            byteLength: invoiceFile.size,
            addedAt: order.createdAt,
            ciphertext: invoiceBlob.ciphertext,
            iv: invoiceBlob.iv,
        };
        attachDocumentToPassport(it.passportId, invoiceDoc);

        const warrantyFile = buildWarrantyFile(it.passport, order.number);
        const warrantyBlob = await encryptFile(warrantyFile, input.userId);
        const warrantyDoc: WardrobeDocument = {
            id: crypto.randomUUID(),
            kind: 'warranty',
            fileName: `Garantie ${it.reference}`,
            mimeType: 'image/png',
            byteLength: warrantyFile.size,
            addedAt: order.createdAt,
            ciphertext: warrantyBlob.ciphertext,
            iv: warrantyBlob.iv,
        };
        attachDocumentToPassport(it.passportId, warrantyDoc);
    }

    appendOrder(order);
    clearCart();
    return order;
}
