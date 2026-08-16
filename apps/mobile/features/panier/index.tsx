'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Loader2, Minus, Package, Plus, Shirt, ShoppingBag, Trash2 } from 'lucide-react';
import { routes } from '@/lib/routes';
import {
    formatCents,
    removeFromCart,
    setCartQuantity,
    useCartDetails,
    variantLabel,
    type CartItemDetail,
    type CartShipment,
    type UnavailableLine,
} from '@/lib/marketplace';

export function Panier() {
    const router = useRouter();
    const {
        shipments,
        subtotalCents,
        shippingCents,
        totalCents,
        count,
        unavailable,
        overstocked,
        needsVariant,
        hasBlockingIssue,
        isLoading,
    } = useCartDetails();
    const empty = shipments.length === 0 && unavailable.length === 0;

    return (
        <div className="flex h-full flex-col overflow-y-auto bg-background pb-52">
            <motion.header
                className="flex items-center gap-3 px-4 pt-12 pb-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <button
                    type="button"
                    onClick={() => router.back()}
                    aria-label="Retour"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                    <h1 className="text-base font-bold text-foreground">Panier</h1>
                    <p className="text-xs text-muted-foreground">
                        {count} article{count > 1 ? 's' : ''}
                        {shipments.length > 1 ? ` · ${shipments.length} ateliers` : ''}
                    </p>
                </div>
            </motion.header>

            {unavailable.length > 0 ? <UnavailableNotice lines={unavailable} /> : null}
            {needsVariant.length > 0 ? <ChooseVariantNotice lines={needsVariant} /> : null}
            {overstocked.length > 0 ? <StockNotice items={overstocked} /> : null}

            {isLoading && empty ? (
                <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Chargement du panier…
                </div>
            ) : empty ? (
                <EmptyCart />
            ) : (
                <>
                    <div className="flex flex-col gap-4 px-4">
                        {shipments.map((shipment, index) => (
                            <ShipmentCard
                                key={shipment.artisanProfileId}
                                shipment={shipment}
                                index={index}
                                total={shipments.length}
                            />
                        ))}
                    </div>

                    <CartSummary
                        subtotalCents={subtotalCents}
                        shippingCents={shippingCents}
                        totalCents={totalCents}
                        shipmentCount={shipments.length}
                        blocked={hasBlockingIssue}
                    />
                </>
            )}
        </div>
    );
}

// Un colis = un atelier. Le regroupement rend lisible ce que l'acheteur paie en livraison et
// combien de paquets il recevra — sur un panier multi-atelier, c'est la seule façon honnête
// d'expliquer le total.
function ShipmentCard({ shipment, index, total }: { shipment: CartShipment; index: number; total: number }) {
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
                    {shipment.shippingCents === 0 ? 'Offerte' : formatCents(shipment.shippingCents)}
                </span>
            </footer>
        </section>
    );
}

function CartRow({ item }: { item: CartItemDetail }) {
    const { product, variant } = item;
    const label = variantLabel(variant);
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

                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <div className="inline-flex items-center rounded-full border border-border">
                        <button
                            type="button"
                            aria-label="Diminuer la quantité"
                            onClick={() => setCartQuantity(product.id, variant.id, item.quantity - 1)}
                            className="inline-flex h-7 w-7 items-center justify-center text-foreground"
                        >
                            <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-6 text-center text-sm font-semibold text-foreground tabular-nums">
                            {item.quantity}
                        </span>
                        <button
                            type="button"
                            aria-label="Augmenter la quantité"
                            disabled={item.quantity >= item.availableQuantity}
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

// L'atelier a décliné sa pièce depuis l'ajout au panier : l'acheteur doit choisir sa taille avant
// de payer, plutôt que de découvrir un refus au moment du paiement.
function ChooseVariantNotice({ lines }: { lines: readonly UnavailableLine[] }) {
    return (
        <div className="mb-2 px-4">
            <div className="rounded-2xl border border-lumiris-amber/30 bg-lumiris-amber/10 p-3" role="status">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-lumiris-amber">
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                    {lines.length > 1 ? 'Des tailles restent à choisir' : 'Une taille reste à choisir'}
                </p>
                <ul className="mt-1 flex flex-col gap-1 text-xs text-muted-foreground">
                    {lines.map((line) => (
                        <li key={`${line.productId}:${line.variantId ?? ''}`}>
                            <Link href={routes.product(line.productId)} className="underline underline-offset-2">
                                {line.name ?? 'Cette pièce'}
                            </Link>{' '}
                            est désormais proposée en plusieurs déclinaisons.
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

// Une pièce disparue ou en rupture ne doit pas se découvrir à l'écran de paiement, sous forme
// d'erreur technique : on nomme le problème ici, avec le geste qui le résout.
function UnavailableNotice({ lines }: { lines: readonly UnavailableLine[] }) {
    return (
        <div className="mb-2 px-4">
            <div className="rounded-2xl border border-lumiris-amber/30 bg-lumiris-amber/10 p-3" role="status">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-lumiris-amber">
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                    {lines.length > 1
                        ? `${lines.length} pièces ne sont plus en vente`
                        : 'Une pièce n’est plus en vente'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Ces pièces uniques ont été vendues ou retirées par leur atelier. Retire-les pour continuer.
                </p>
                <button
                    type="button"
                    onClick={() => lines.forEach((line) => removeFromCart(line.productId, line.variantId))}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-lumiris-amber/40 px-3 py-1.5 text-xs font-semibold text-foreground"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                    Retirer {lines.length > 1 ? 'ces pièces' : 'cette pièce'}
                </button>
            </div>
        </div>
    );
}

// Le stock a baissé depuis l'ajout au panier : on propose d'ajuster plutôt que de laisser le
// paiement échouer sur un « stock insuffisant » venu du serveur.
function StockNotice({ items }: { items: readonly CartItemDetail[] }) {
    return (
        <div className="mb-2 px-4">
            <div className="rounded-2xl border border-lumiris-amber/30 bg-lumiris-amber/10 p-3" role="status">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-lumiris-amber">
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                    Stock insuffisant
                </p>
                <ul className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground">
                    {items.map((it) => (
                        <li key={`${it.product.id}:${it.variant.id}`}>
                            {it.product.name}
                            {variantLabel(it.variant) ? ` (${variantLabel(it.variant)})` : ''} —{' '}
                            {it.availableQuantity === 0
                                ? 'épuisée'
                                : `plus que ${it.availableQuantity} disponible${it.availableQuantity > 1 ? 's' : ''}`}
                        </li>
                    ))}
                </ul>
                <button
                    type="button"
                    onClick={() =>
                        items.forEach((it) =>
                            it.availableQuantity === 0
                                ? removeFromCart(it.product.id, it.variant.id)
                                : setCartQuantity(it.product.id, it.variant.id, it.availableQuantity),
                        )
                    }
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-lumiris-amber/40 px-3 py-1.5 text-xs font-semibold text-foreground"
                >
                    Ajuster mon panier
                </button>
            </div>
        </div>
    );
}

function CartSummary({
    subtotalCents,
    shippingCents,
    totalCents,
    shipmentCount,
    blocked,
}: {
    subtotalCents: number;
    shippingCents: number;
    totalCents: number;
    shipmentCount: number;
    blocked: boolean;
}) {
    return (
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-border/60 bg-background/90 px-4 pt-3 pb-6 backdrop-blur">
            <dl className="mb-3 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                    <dt className="text-muted-foreground">Sous-total</dt>
                    <dd className="text-foreground tabular-nums">{formatCents(subtotalCents)}</dd>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <dt className="text-muted-foreground">
                        Livraison{shipmentCount > 1 ? ` · ${shipmentCount} colis` : ''}
                    </dt>
                    <dd className="text-foreground tabular-nums">
                        {shippingCents === 0 ? 'Offerte' : formatCents(shippingCents)}
                    </dd>
                </div>
                <div className="mt-1 flex items-center justify-between border-t border-border/60 pt-1.5 text-sm font-semibold">
                    <dt className="text-foreground">Total</dt>
                    <dd className="text-foreground tabular-nums">{formatCents(totalCents)}</dd>
                </div>
            </dl>
            {blocked ? (
                <span className="flex w-full items-center justify-center gap-2 rounded-full bg-muted py-3 text-sm font-semibold text-muted-foreground">
                    Ajuste ton panier pour continuer
                </span>
            ) : (
                <Link
                    href="/checkout"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm font-semibold text-primary-foreground"
                >
                    Passer la commande
                </Link>
            )}
        </div>
    );
}

function EmptyCart() {
    return (
        <motion.div
            className="flex flex-1 flex-col items-center justify-center gap-4 px-8 pb-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-border/60 bg-card">
                <ShoppingBag className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
                <h2 className="text-base font-semibold text-foreground">Ton panier est vide</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Découvre des pièces tracées et garanties dans la Boutique.
                </p>
            </div>
            <Link
                href="/boutique"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
                <ShoppingBag className="h-4 w-4" />
                Voir la Boutique
            </Link>
        </motion.div>
    );
}
