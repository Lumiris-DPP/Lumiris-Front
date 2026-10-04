'use client';

import Link from '@/components/navigation-link';
import Image from 'next/image';

import { Minus, Package, Plus, Shirt, Trash2 } from 'lucide-react';

import { routes } from '@/lib/routes';
import { formatCents, shippingCostLabel } from '@/lib/marketplace/money';
import { removeFromCart, setCartQuantity } from '@/lib/marketplace/cart-storage';
import { variantLabel } from '@/lib/marketplace/product';
import { type CartItemDetail, type CartShipment } from '@/lib/marketplace/cart-model';

// Affiche les articles et la livraison d’un atelier.
export function ShipmentCard({ shipment, index, total }: { shipment: CartShipment; index: number; total: number }) {
    return (
        <section className="opal-shadow overflow-hidden rounded-2xl border border-border/60 bg-card">
            <header className="flex items-center gap-2 border-b border-border/60 px-3 py-2.5">
                <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <p className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">{shipment.artisanName}</p>
                {total > 1 ? (
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                        Colis {index + 1}/{total}
                    </span>
                ) : null}
            </header>

            <ul className="flex flex-col">
                {shipment.items.map((item) => (
                    <CartRow key={`${item.product.id}:${item.variant.id}`} item={item} />
                ))}
            </ul>

            <footer className="flex items-center justify-between border-t border-border/60 px-3 py-2 text-[11px]">
                <span className="text-muted-foreground">Livraison de cet atelier</span>
                <span className="font-semibold text-foreground tabular-nums">
                    {shippingCostLabel(shipment.shippingCents)}
                </span>
            </footer>
        </section>
    );
}

// Affiche une ligne du panier et ses contrôles de quantité.
function CartRow({ item }: { item: CartItemDetail }) {
    const { product, variant } = item;
    const label = variantLabel(variant);

    const atStockLimit = item.quantity >= item.availableQuantity;
    return (
        <li className="flex gap-3 border-b border-border/40 p-3 last:border-b-0">
            <Link
                href={routes.product(product.id)}
                aria-label={product.name}
                className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted"
            >
                {product.photoUrl ? (
                    <Image
                        src={product.photoUrl}
                        alt={product.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                        unoptimized
                    />
                ) : (
                    <Shirt className="h-8 w-8 text-muted-foreground/30" strokeWidth={1.5} aria-hidden />
                )}
            </Link>

            <div className="flex min-w-0 flex-1 flex-col">
                <Link href={routes.product(product.id)} className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
                    {label ? <p className="truncate text-xs text-muted-foreground">{label}</p> : null}
                    <p className="text-xs text-muted-foreground">{formatCents(product.priceCents)} l&apos;unité</p>
                </Link>

                {atStockLimit ? (
                    <p className="mt-1 text-[11px] text-lumiris-amber">
                        {item.availableQuantity <= 1
                            ? 'Dernière pièce disponible dans cette déclinaison.'
                            : `Stock limité : ${item.availableQuantity} pièces disponibles.`}
                    </p>
                ) : null}

                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <div className="inline-flex items-center rounded-full border border-border">
                        <button
                            type="button"
                            aria-label={`Diminuer la quantité de ${product.name}`}
                            onClick={() => setCartQuantity(product.id, variant.id, item.quantity - 1)}
                            className="inline-flex h-7 w-7 items-center justify-center text-foreground"
                        >
                            <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span
                            aria-live="polite"
                            className="min-w-6 text-center text-sm font-semibold text-foreground tabular-nums"
                        >
                            <span className="sr-only">Quantité : </span>
                            {item.quantity}
                        </span>
                        <button
                            type="button"
                            aria-label={`Augmenter la quantité de ${product.name}`}
                            disabled={atStockLimit}
                            title={atStockLimit ? `Stock disponible : ${item.availableQuantity}` : undefined}
                            onClick={() => setCartQuantity(product.id, variant.id, item.quantity + 1)}
                            className="inline-flex h-7 w-7 items-center justify-center text-foreground disabled:opacity-30"
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <span className="text-sm font-semibold text-foreground tabular-nums">
                        {formatCents(item.lineTotalCents)}
                    </span>
                </div>
            </div>

            <button
                type="button"
                aria-label={`Retirer ${product.name} du panier`}
                onClick={() => removeFromCart(product.id, variant.id)}
                className="self-start text-muted-foreground hover:text-lumiris-rose"
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </li>
    );
}
