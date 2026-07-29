'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Minus, Plus, Shirt, ShoppingBag, Trash2, Truck } from 'lucide-react';
import Image from 'next/image';
import { routes } from '@/lib/routes';
import { formatCents, removeFromCart, setCartQuantity, useCartDetails } from '@/lib/marketplace';

export function Panier() {
    const router = useRouter();
    const { items, subtotalCents, count, sellerCount, missingCount, isLoading } = useCartDetails();
    const empty = items.length === 0;
    const multiSeller = sellerCount > 1;

    return (
        <div className="flex h-full flex-col overflow-y-auto bg-background pb-44">
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
                    </p>
                </div>
            </motion.header>

            {!isLoading && missingCount > 0 ? (
                <div className="mb-1 px-4">
                    <p
                        className="rounded-2xl border border-lumiris-amber/30 bg-lumiris-amber/10 p-3 text-xs text-lumiris-amber"
                        role="status"
                    >
                        {missingCount} article{missingCount > 1 ? 's' : ''} ne{' '}
                        {missingCount > 1 ? 'sont plus disponibles' : 'est plus disponible'} et{' '}
                        {missingCount > 1 ? 'ont' : 'a'} été retiré{missingCount > 1 ? 's' : ''}.
                    </p>
                </div>
            ) : null}

            {isLoading && empty ? (
                <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Chargement du panier…
                </div>
            ) : empty ? (
                <EmptyCart />
            ) : (
                <>
                    <ul className="flex flex-col gap-3 px-4">
                        {items.map((item) => {
                            const { product } = item;
                            return (
                                <li
                                    key={product.id}
                                    className="opal-shadow flex gap-3 rounded-2xl border border-border/60 bg-card p-3"
                                >
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
                                            <Shirt
                                                className="h-8 w-8 text-muted-foreground/30"
                                                strokeWidth={1.5}
                                                aria-hidden
                                            />
                                        )}
                                    </Link>

                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <Link href={routes.product(product.id)} className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-foreground">
                                                {product.name}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {product.artisanName}
                                            </p>
                                        </Link>

                                        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                                            <div className="inline-flex items-center rounded-full border border-border">
                                                <button
                                                    type="button"
                                                    aria-label="Diminuer la quantité"
                                                    onClick={() => setCartQuantity(product.id, item.quantity - 1)}
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
                                                    disabled={item.quantity >= product.stock}
                                                    onClick={() => setCartQuantity(product.id, item.quantity + 1)}
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
                                        onClick={() => removeFromCart(product.id)}
                                        className="self-start text-muted-foreground hover:text-lumiris-rose"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="mt-5 px-4">
                        <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card p-3">
                            <Truck className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                                Frais de port calculés à l&apos;étape paiement selon l&apos;atelier.
                            </p>
                        </div>
                    </div>

                    {multiSeller ? (
                        <div className="mt-3 px-4">
                            <p className="rounded-2xl border border-lumiris-amber/30 bg-lumiris-amber/10 p-3 text-xs text-lumiris-amber">
                                Ton panier contient des pièces de plusieurs ateliers. Chaque atelier se règle séparément
                                — retire des pièces pour ne garder qu&apos;un atelier.
                            </p>
                        </div>
                    ) : null}

                    <CartSummary subtotalCents={subtotalCents} disabled={multiSeller} />
                </>
            )}
        </div>
    );
}

function CartSummary({ subtotalCents, disabled }: { subtotalCents: number; disabled: boolean }) {
    return (
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-border/60 bg-background/90 px-4 pt-3 pb-6 backdrop-blur">
            <dl className="mb-3 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                    <dt className="text-muted-foreground">Sous-total</dt>
                    <dd className="text-foreground tabular-nums">{formatCents(subtotalCents)}</dd>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <dt className="text-muted-foreground">Frais de port</dt>
                    <dd className="text-muted-foreground tabular-nums">Calculés au paiement</dd>
                </div>
            </dl>
            {disabled ? (
                <span className="flex w-full items-center justify-center gap-2 rounded-full bg-muted py-3 text-sm font-semibold text-muted-foreground">
                    Un seul atelier par commande
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
