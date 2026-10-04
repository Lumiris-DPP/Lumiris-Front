import type { MarketplaceVariant, OrderStatus } from '@lumiris/api-client';
import type { MarketplaceItem } from './product';

export interface CartLine {
    productId: string;

    variantId: string | null;
    quantity: number;
    addedAt: string;
}

export interface PurchasedLine {
    productId: string;
    variantId: string | null;
    quantity: number;
}

export interface CartItemDetail {
    product: MarketplaceItem;

    variant: MarketplaceVariant;
    quantity: number;
    lineTotalCents: number;

    availableQuantity: number;
}

export interface CartShipment {
    artisanProfileId: string;
    artisanName: string;
    items: CartItemDetail[];
    itemsTotalCents: number;

    shippingCents: number;
}

export interface UnavailableLine {
    productId: string;
    variantId: string | null;
    quantity: number;
    name?: string;
}

export type CartLoadState = 'loading' | 'error' | 'ready';

export interface CartDetails {
    lines: readonly CartLine[];
    items: readonly CartItemDetail[];

    shipments: readonly CartShipment[];
    subtotalCents: number;
    shippingCents: number;
    totalCents: number;
    count: number;

    unavailable: readonly UnavailableLine[];

    overstocked: readonly CartItemDetail[];

    needsVariant: readonly UnavailableLine[];
    loadState: CartLoadState;

    hasBlockingIssue: boolean;
}

// Identifie une ligne par produit et déclinaison.
export function cartLineKey(productId: string, variantId: string | null): string {
    return `${productId}:${variantId ?? ''}`;
}

// Calcule les lignes, les envois et les problèmes du panier.
export function buildCartDetails(
    lines: readonly CartLine[],
    products: readonly MarketplaceItem[] | undefined,
    loadState: CartLoadState,
): CartDetails {
    lines = resolveCartLines(lines, products ?? []);
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

// Résout les déclinaisons uniques et réunit les lignes correspondantes.
export function resolveCartLines<T extends PurchasedLine>(
    lines: readonly T[],
    products: readonly MarketplaceItem[],
): T[] {
    const merged = new Map<string, T>();
    for (const line of lines) {
        const product = products.find((item) => item.id === line.productId);
        const variantId = line.variantId ?? (product?.variants.length === 1 ? (product.variants[0]?.id ?? null) : null);
        const key = cartLineKey(line.productId, variantId);
        const previous = merged.get(key);
        merged.set(key, { ...line, variantId, quantity: (previous?.quantity ?? 0) + line.quantity });
    }
    return [...merged.values()];
}

// Retire du panier uniquement les quantités achetées.
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

// Reconnaît les statuts correspondant à une commande payée.
export function isPaidOrderStatus(status: OrderStatus): boolean {
    return status !== 'PENDING' && status !== 'CANCELLED' && status !== 'REFUNDED';
}

// Classe les achats confirmés ou abandonnés sans traiter ceux en attente.
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

// Trouve la déclinaison choisie ou l’unique déclinaison du produit.
function resolveVariant(product: MarketplaceItem, variantId: string | null): MarketplaceVariant | null {
    if (variantId) return product.variants.find((v) => v.id === variantId) ?? null;
    return product.variants.length === 1 ? (product.variants[0] ?? null) : null;
}

// Regroupe les articles par atelier avec leurs frais de livraison.
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
