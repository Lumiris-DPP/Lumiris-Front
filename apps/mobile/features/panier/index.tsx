'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Minus, Plus, Shirt, ShoppingBag, Trash2, Truck } from 'lucide-react';
import Image from 'next/image';
import { formatCents, removeFromCart, setCartQuantity, useCartDetails } from '@/lib/marketplace';

export function Panier() {
    const router = useRouter();
    const { items, subtotalCents, count, sellerCount, missingCount, isLoading } = useCartDetails();
    const empty = items.length === 0;
    const multiSeller = sellerCount > 1;

    return (
        <div className="bg-background flex h-full flex-col overflow-y-auto pb-44">
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
                        {count} article{count > 1 ? 's' : ''}
                    </p>
                </div>
            </motion.header>

            {!isLoading && missingCount > 0 ? (
                <div className="mb-1 px-4">
                    <p
                        className="border-lumiris-amber/30 bg-lumiris-amber/10 text-lumiris-amber rounded-2xl border p-3 text-xs"
                        role="status"
                    >
                        {missingCount} article{missingCount > 1 ? 's' : ''} ne{' '}
                        {missingCount > 1 ? 'sont plus disponibles' : 'est plus disponible'} et{' '}
                        {missingCount > 1 ? 'ont' : 'a'} été retiré{missingCount > 1 ? 's' : ''}.
                    </p>
                </div>
            ) : null}

            {isLoading && empty ? (
                <div className="text-muted-foreground flex flex-1 items-center justify-center gap-2 text-sm">
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
                                    className="border-border/60 bg-card opal-shadow flex gap-3 rounded-2xl border p-3"
                                >
                                    <Link
                                        href={`/boutique/${product.id}`}
                                        aria-label={product.name}
                                        className="bg-muted relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl"
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
                                                className="text-muted-foreground/30 h-8 w-8"
                                                strokeWidth={1.5}
                                                aria-hidden
                                            />
                                        )}
                                    </Link>

                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <Link href={`/boutique/${product.id}`} className="min-w-0">
                                            <p className="text-foreground truncate text-sm font-semibold">
                                                {product.name}
                                            </p>
                                            <p className="text-muted-foreground truncate text-xs">
                                                {product.artisanName}
                                            </p>
                                        </Link>

                                        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                                            <div className="border-border inline-flex items-center rounded-full border">
                                                <button
                                                    type="button"
                                                    aria-label="Diminuer la quantité"
                                                    onClick={() => setCartQuantity(product.id, item.quantity - 1)}
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
                                                    disabled={item.quantity >= product.stock}
                                                    onClick={() => setCartQuantity(product.id, item.quantity + 1)}
                                                    className="text-foreground inline-flex h-7 w-7 items-center justify-center disabled:opacity-30"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                </button>
                                            </div>

                                            <span className="text-foreground text-sm font-semibold tabular-nums">
                                                {formatCents(item.lineTotalCents)}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        aria-label={`Retirer ${product.name} du panier`}
                                        onClick={() => removeFromCart(product.id)}
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
                                Frais de port calculés à l&apos;étape paiement selon l&apos;atelier.
                            </p>
                        </div>
                    </div>

                    {multiSeller ? (
                        <div className="mt-3 px-4">
                            <p className="border-lumiris-amber/30 bg-lumiris-amber/10 text-lumiris-amber rounded-2xl border p-3 text-xs">
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
        <div className="border-border/60 bg-background/90 fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t px-4 pb-6 pt-3 backdrop-blur">
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
                <span className="bg-muted text-muted-foreground flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold">
                    Un seul atelier par commande
                </span>
            ) : (
                <Link
                    href="/checkout"
                    className="bg-foreground text-primary-foreground flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold"
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
