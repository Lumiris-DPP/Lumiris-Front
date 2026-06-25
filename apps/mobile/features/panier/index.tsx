'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, Shirt, ShoppingBag, Trash2, Truck } from 'lucide-react';
import { computeCartTotals, formatEur, getListing, removeFromCart, setCartQuantity, useCart } from '@/lib/marketplace';

export function Panier() {
    const router = useRouter();
    const lines = useCart();
    const totals = useMemo(() => computeCartTotals(lines), [lines]);
    const empty = totals.items.length === 0;

    return (
        <div className="bg-background flex h-full flex-col overflow-y-auto pb-40">
            <motion.header
                className="flex items-center gap-3 px-4 pb-3 pt-12"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <button
                    type="button"
                    onClick={() => router.back()}
                    aria-label="Retour"
                    className="border-border bg-card text-foreground inline-flex h-9 w-9 items-center justify-center rounded-full border"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                    <h1 className="text-foreground text-base font-bold">Panier</h1>
                    <p className="text-muted-foreground text-xs">
                        {totals.count} article{totals.count > 1 ? 's' : ''}
                    </p>
                </div>
            </motion.header>

            {empty ? (
                <EmptyCart />
            ) : (
                <>
                    <ul className="flex flex-col gap-3 px-4">
                        {totals.items.map((item) => {
                            const stock = getListing(item.passportId)?.stock ?? 0;
                            return (
                                <li
                                    key={item.passportId}
                                    className="border-border/60 bg-card opal-shadow flex gap-3 rounded-2xl border p-3"
                                >
                                    <Link
                                        href={`/boutique/${item.passportId}`}
                                        aria-label={item.reference}
                                        className="bg-muted flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                                    >
                                        <Shirt
                                            className="text-muted-foreground/30 h-8 w-8"
                                            strokeWidth={1.5}
                                            aria-hidden
                                        />
                                    </Link>

                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <Link href={`/boutique/${item.passportId}`} className="min-w-0">
                                            <p className="text-foreground truncate text-sm font-semibold">
                                                {item.reference}
                                            </p>
                                            <p className="text-muted-foreground truncate text-xs">{item.artisanName}</p>
                                        </Link>

                                        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                                            <div className="border-border inline-flex items-center rounded-full border">
                                                <button
                                                    type="button"
                                                    aria-label="Diminuer la quantité"
                                                    onClick={() => setCartQuantity(item.passportId, item.quantity - 1)}
                                                    className="text-foreground inline-flex h-7 w-7 items-center justify-center"
                                                >
                                                    <Minus className="h-3.5 w-3.5" />
                                                </button>
                                                <span className="text-foreground min-w-6 text-center text-sm font-semibold tabular-nums">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    type="button"
                                                    aria-label="Augmenter la quantité"
                                                    disabled={item.quantity >= stock}
                                                    onClick={() => setCartQuantity(item.passportId, item.quantity + 1)}
                                                    className="text-foreground inline-flex h-7 w-7 items-center justify-center disabled:opacity-30"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                </button>
                                            </div>

                                            <span className="text-foreground text-sm font-semibold tabular-nums">
                                                {formatEur(item.lineTotal)}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        aria-label={`Retirer ${item.reference} du panier`}
                                        onClick={() => removeFromCart(item.passportId)}
                                        className="text-muted-foreground hover:text-lumiris-rose self-start"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="mt-5 px-4">
                        <div className="border-border/60 bg-card flex items-center gap-2 rounded-2xl border p-3">
                            <Truck className="text-muted-foreground h-4 w-4 shrink-0" />
                            <p className="text-muted-foreground text-xs">
                                Livraison estimée sous {Math.max(...totals.items.map((i) => i.shippingDays))} jours
                                ouvrés.
                            </p>
                        </div>
                    </div>

                    <CartSummary subtotal={totals.subtotal} shipping={totals.shipping} total={totals.total} />
                </>
            )}
        </div>
    );
}

function CartSummary({ subtotal, shipping, total }: { subtotal: number; shipping: number; total: number }) {
    return (
        <div className="border-border/60 bg-background/90 fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t px-4 pb-6 pt-3 backdrop-blur">
            <dl className="mb-3 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                    <dt className="text-muted-foreground">Sous-total</dt>
                    <dd className="text-foreground tabular-nums">{formatEur(subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <dt className="text-muted-foreground">Frais de port</dt>
                    <dd className="text-foreground tabular-nums">{formatEur(shipping)}</dd>
                </div>
                <div className="border-border/60 mt-1 flex items-center justify-between border-t pt-2 text-sm font-semibold">
                    <dt className="text-foreground">Total</dt>
                    <dd className="text-foreground tabular-nums">{formatEur(total)}</dd>
                </div>
            </dl>
            <Link
                href="/checkout"
                className="bg-foreground text-primary-foreground flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold"
            >
                Passer la commande
            </Link>
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
            <div className="border-border/60 bg-card flex h-16 w-16 items-center justify-center rounded-3xl border">
                <ShoppingBag className="text-muted-foreground h-7 w-7" />
            </div>
            <div>
                <h2 className="text-foreground text-base font-semibold">Ton panier est vide</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    Découvre des pièces tracées et garanties dans la Boutique.
                </p>
            </div>
            <Link
                href="/boutique"
                className="bg-foreground text-primary-foreground inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
            >
                <ShoppingBag className="h-4 w-4" />
                Voir la Boutique
            </Link>
        </motion.div>
    );
}
