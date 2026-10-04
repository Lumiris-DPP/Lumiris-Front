'use client';

import { ShipmentCard } from './components/shipment-card';
import { CartSummary } from './components/cart-summary';
import {
    ChooseVariantNotice,
    LoadErrorNotice,
    UnavailableNotice,
    StockNotice,
    EmptyCart,
} from './components/cart-notices';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { useCartDetails } from '@/lib/marketplace/use-cart-details';

// Affiche le panier et les problèmes à résoudre avant le paiement.
export function Panier() {
    const router = useRouter();
    const {
        lines,
        shipments,
        subtotalCents,
        shippingCents,
        totalCents,
        count,
        unavailable,
        overstocked,
        needsVariant,
        hasBlockingIssue,
        loadState,
        retry,
    } = useCartDetails();
    const empty = lines.length === 0;

    const shownCount = loadState === 'ready' ? count : lines.reduce((sum, line) => sum + line.quantity, 0);

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
                        {shownCount} article{shownCount > 1 ? 's' : ''}
                        {shipments.length > 1 ? ` · ${shipments.length} ateliers` : ''}
                    </p>
                </div>
            </motion.header>

            {unavailable.length > 0 ? <UnavailableNotice lines={unavailable} /> : null}
            {needsVariant.length > 0 ? <ChooseVariantNotice lines={needsVariant} /> : null}
            {overstocked.length > 0 ? <StockNotice items={overstocked} /> : null}

            {empty ? (
                <EmptyCart />
            ) : loadState === 'loading' ? (
                <div
                    role="status"
                    className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground"
                >
                    <Loader2 className="h-4 w-4 animate-spin" /> Chargement du panier…
                </div>
            ) : loadState === 'error' ? (
                <LoadErrorNotice onRetry={retry} />
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
