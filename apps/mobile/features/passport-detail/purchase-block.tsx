'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShoppingCart, Check, Truck } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import type { Passport } from '@lumiris/types';
import { addToCart, formatEur, getListing, useCart } from '@/lib/marketplace';
import { toast } from '@/lib/toast';

interface PurchaseBlockProps {
    passport: Passport;
    artisanName: string;
}

/**
 * Bloc Achat intégré (sticky) affiché quand la pièce est EN VENTE dans la Boutique.
 * Le passeport EST la fiche produit. Vient compléter le modèle affilié existant.
 */
export function PurchaseBlock({ passport, artisanName }: PurchaseBlockProps) {
    const router = useRouter();
    const listing = getListing(passport.id);
    const cart = useCart();
    const [added, setAdded] = useState(false);

    const inCart = cart.some((line) => line.passportId === passport.id);
    const soldOut = !listing || listing.stock <= 0;

    const onAddToCart = useCallback(() => {
        addToCart(passport.id, 1);
        setAdded(true);
        toast.success('Ajouté au panier');
        window.setTimeout(() => setAdded(false), 1600);
    }, [passport.id]);

    const onBuyNow = useCallback(() => {
        addToCart(passport.id, 1);
        router.push('/panier');
    }, [passport.id, router]);

    if (!listing) {
        return (
            <div className="border-border/60 bg-muted/40 mx-4 mb-2 rounded-2xl border p-4 text-center">
                <p className="text-muted-foreground text-xs">Cette pièce n&apos;est pas disponible à l&apos;achat.</p>
            </div>
        );
    }

    const price = passport.garment.retailPrice;

    return (
        <motion.aside
            aria-label="Acheter cette pièce"
            className="border-border/60 bg-background/90 fixed inset-x-0 bottom-[4.75rem] z-40 mx-auto max-w-md border-t px-4 pb-3 pt-3 backdrop-blur-xl"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32, delay: 0.5 }}
        >
            <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-foreground font-mono text-xl font-bold leading-none">{formatEur(price)}</p>
                    <p className="text-muted-foreground mt-1 inline-flex items-center gap-1 text-[11px]">
                        <Truck className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                        Vendu par {artisanName} · {listing.shippingDays} j
                    </p>
                </div>
                {soldOut ? (
                    <span className="text-lumiris-rose text-xs font-semibold">Épuisé</span>
                ) : listing.stock <= 3 ? (
                    <span className="text-lumiris-amber text-[11px] font-medium">
                        Plus que {listing.stock} en stock
                    </span>
                ) : null}
            </div>

            <div className="mt-2.5 flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onAddToCart}
                    disabled={soldOut}
                    className="h-11 flex-1 rounded-full text-sm font-semibold"
                >
                    {added || inCart ? (
                        <>
                            <Check className="h-4 w-4" strokeWidth={1.5} />
                            {inCart ? 'Dans le panier' : 'Ajouté'}
                        </>
                    ) : (
                        <>
                            <ShoppingCart className="h-4 w-4" strokeWidth={1.5} />
                            Ajouter
                        </>
                    )}
                </Button>
                <Button
                    type="button"
                    onClick={onBuyNow}
                    disabled={soldOut}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 flex-[1.4] rounded-full text-sm font-semibold"
                >
                    Acheter — {formatEur(price)}
                </Button>
            </div>
        </motion.aside>
    );
}
