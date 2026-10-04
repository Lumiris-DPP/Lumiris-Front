'use client';

import Link from '@/components/navigation-link';

import { motion } from 'framer-motion';
import { AlertTriangle, ShoppingBag, Trash2 } from 'lucide-react';

import { routes } from '@/lib/routes';
import { removeFromCart, setCartQuantity } from '@/lib/marketplace/cart-storage';
import { variantLabel } from '@/lib/marketplace/product';
import { type CartItemDetail, type UnavailableLine } from '@/lib/marketplace/cart-model';

// Signale les pièces dont la déclinaison reste à choisir.
export function ChooseVariantNotice({ lines }: { lines: readonly UnavailableLine[] }) {
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

// Propose de recharger le panier en conservant ses pièces.
export function LoadErrorNotice({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="px-4">
            <div className="rounded-2xl border border-lumiris-amber/30 bg-lumiris-amber/10 p-3" role="alert">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-lumiris-amber">
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                    Impossible de charger ton panier
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Tes pièces sont conservées. Vérifie ta connexion puis réessaie.
                </p>
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-lumiris-amber/40 px-3 py-1.5 text-xs font-semibold text-foreground"
                >
                    Réessayer
                </button>
            </div>
        </div>
    );
}

// Signale les pièces retirées de la vente et permet leur retrait.
export function UnavailableNotice({ lines }: { lines: readonly UnavailableLine[] }) {
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

// Signale le stock insuffisant et permet d’ajuster le panier.
export function StockNotice({ items }: { items: readonly CartItemDetail[] }) {
    return (
        <div className="mb-2 px-4">
            <div className="rounded-2xl border border-lumiris-amber/30 bg-lumiris-amber/10 p-3" role="status">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-lumiris-amber">
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                    Stock insuffisant
                </p>
                <ul className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground">
                    {items.map((it) => {
                        const label = variantLabel(it.variant);
                        return (
                            <li key={`${it.product.id}:${it.variant.id}`}>
                                {it.product.name}
                                {label ? ` (${label})` : ''} —{' '}
                                {it.availableQuantity === 0
                                    ? 'épuisée'
                                    : `plus que ${it.availableQuantity} disponible${it.availableQuantity > 1 ? 's' : ''}`}
                            </li>
                        );
                    })}
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

// Affiche le panier vide et le lien vers la boutique.
export function EmptyCart() {
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
