'use client';

import Link from '@/components/navigation-link';

import { usePaymentOptions } from '@lumiris/api-client/react';

import { formatCents, installmentLabel, shippingCostLabel } from '@/lib/marketplace/money';

// Affiche les montants du panier et l’accès au paiement.
export function CartSummary({
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
    const { data: paymentOptions } = usePaymentOptions();
    const installment = installmentLabel(totalCents, paymentOptions);

    return (
        <div className="fixed inset-x-0 bottom-0 z-nav mx-auto max-w-md border-t border-border/60 bg-background/90 px-4 pt-3 pb-6 backdrop-blur">
            <dl className="mb-3 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                    <dt className="text-muted-foreground">Sous-total</dt>
                    <dd className="text-foreground tabular-nums">{formatCents(subtotalCents)}</dd>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <dt className="text-muted-foreground">
                        Livraison{shipmentCount > 1 ? ` · ${shipmentCount} colis` : ''}
                    </dt>
                    <dd className="text-foreground tabular-nums">{shippingCostLabel(shippingCents)}</dd>
                </div>
                <div className="mt-1 flex items-center justify-between border-t border-border/60 pt-1.5 text-sm font-semibold">
                    <dt className="text-foreground">Total</dt>
                    <dd className="text-foreground tabular-nums">{formatCents(totalCents)}</dd>
                </div>
                {installment ? (
                    <div className="flex justify-end">
                        <dd className="text-[11px] font-medium text-lumiris-cyan">{installment}</dd>
                    </div>
                ) : null}
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
