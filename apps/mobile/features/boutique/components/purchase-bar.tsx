'use client';

import { motion } from 'framer-motion';
import { Check, ShoppingCart, Truck } from 'lucide-react';
import { usePaymentOptions } from '@lumiris/api-client/react';
import { Button } from '@lumiris/ui/components/button';
import { cn } from '@lumiris/ui/lib/cn';
import { formatCents, installmentLabel } from '@/lib/marketplace/money';
import { type MarketplaceItem } from '@/lib/marketplace/product';
import { PURCHASE_CTA_LABEL, deliverySummaryOf, stockHintOf, type PurchaseState } from '../models/purchase-state';

interface PurchaseBarProps {
    product: MarketplaceItem;
    state: PurchaseState;
    added: boolean;
    inCart: boolean;
    onAdd: () => void;
    onBuyNow: () => void;
}

export function PurchaseBar({ product, state, added, inCart, onAdd, onBuyNow }: PurchaseBarProps) {
    const { data: paymentOptions } = usePaymentOptions();
    const installment = installmentLabel(product.priceCents, paymentOptions);
    const buyable = state.kind === 'ready';
    const stockHint = stockHintOf(state);

    return (
        <motion.aside
            aria-label="Acheter cette pièce"
            className="fixed inset-x-0 bottom-[4.75rem] z-nav mx-auto max-w-md border-t border-border/60 bg-background/90 px-4 pt-3 pb-3 backdrop-blur-xl"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32, delay: 0.2 }}
        >
            <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                    <p className="font-mono text-xl leading-none font-bold text-foreground">
                        {formatCents(product.priceCents)}
                    </p>
                    {installment ? (
                        <p className="mt-0.5 text-[11px] font-medium text-lumiris-cyan">{installment}</p>
                    ) : null}
                    <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Truck className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                        {deliverySummaryOf(product)}
                    </p>
                </div>
                {}
                <p
                    aria-live="polite"
                    className={cn(
                        'text-right',
                        state.kind === 'sold-out'
                            ? 'text-xs font-semibold text-lumiris-rose'
                            : 'text-[11px] font-medium text-lumiris-amber',
                    )}
                >
                    {stockHint}
                </p>
            </div>

            <div className="mt-2.5 flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onAdd}
                    disabled={!buyable}
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
                    disabled={!buyable}
                    className="h-11 flex-[1.4] rounded-full bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                    {buyable ? `Acheter — ${formatCents(product.priceCents)}` : PURCHASE_CTA_LABEL[state.kind]}
                </Button>
            </div>
        </motion.aside>
    );
}
