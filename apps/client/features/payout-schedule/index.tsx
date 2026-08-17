'use client';

import { CalendarClock, CircleDollarSign, PauseCircle, Wallet } from 'lucide-react';
import type { SellerPayoutEntry } from '@lumiris/api-client';
import { PAYOUT_EXPECTATION_LABEL } from '@lumiris/api-client';
import { useSellerPayouts } from '@lumiris/api-client/react';
import { Skeleton } from '@lumiris/ui/components/skeleton';
import { StatCard } from '@lumiris/ui/components/stat-card';
import { formatDateFr, formatPriceCents } from '@lumiris/utils';
import { useAuthStore } from '@/lib/auth-store';
import { EmptyState } from '@/features/empty-state';
import { OrderStatusBadge } from '@/features/orders-dashboard/status-badge';

export function PayoutSchedule() {
    const token = useAuthStore((s) => s.token);
    const { data, isLoading, error } = useSellerPayouts({ enabled: Boolean(token) });

    if (isLoading) {
        return (
            <div className="space-y-3 p-8">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }
    if (error) {
        return <div className="p-8 text-sm text-destructive">Erreur : {error.message}</div>;
    }
    if (!data) return null;

    const currency = data.currency ?? 'EUR';
    const next = data.entries.find((entry) => entry.expectation === 'SCHEDULED' && entry.expectedAt);

    return (
        <div className="space-y-4 p-8">
            {next ? (
                <section className="rounded-xl border border-lumiris-emerald/40 bg-lumiris-emerald/10 p-4">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <CalendarClock className="h-3.5 w-3.5" />
                        Prochain versement
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
                        {formatPriceCents(next.netCents, currency)} attendus le {formatDateFr(next.expectedAt)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{entryDetail(next)}</p>
                </section>
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard
                    label="Attendus"
                    value={formatPriceCents(data.scheduledCents, currency)}
                    hint="versés à la livraison, port compris"
                    icon={CalendarClock}
                />
                <StatCard
                    label="Déjà versés"
                    value={formatPriceCents(data.releasedCents, currency)}
                    hint="virements partis sur votre compte, port compris"
                    icon={Wallet}
                />
                <StatCard
                    label="Suspendus"
                    value={formatPriceCents(data.onHoldCents, currency)}
                    hint="litige, retour ou virement en cours"
                    icon={PauseCircle}
                />
            </div>

            {data.entries.length === 0 ? (
                <EmptyState
                    icon={CircleDollarSign}
                    title="Aucun versement en attente"
                    description="Vos ventes en cours apparaîtront ici avec leur date de versement."
                />
            ) : (
                <ul className="divide-y divide-border rounded-xl border border-border">
                    {data.entries.map((entry) => (
                        <li key={entry.orderId} className="flex flex-wrap items-center gap-3 p-4">
                            <div className="min-w-56 flex-1">
                                <p className="text-sm font-medium text-foreground">
                                    {entry.productName ?? 'Pièce retirée'}
                                    {entry.variantLabel ? (
                                        <span className="text-muted-foreground"> · {entry.variantLabel}</span>
                                    ) : null}
                                </p>
                                <p className="text-xs text-muted-foreground">{entryDetail(entry)}</p>
                            </div>
                            <OrderStatusBadge status={entry.status} disputeStatus="NONE" />
                            <p className="w-28 text-right text-sm font-semibold text-foreground tabular-nums">
                                {formatPriceCents(entry.netCents, entry.currency ?? currency)}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// Une date quand elle existe, et sinon la raison pour laquelle elle n'existe pas : c'est
// exactement ce qui manquait aux deux totaux « retenu » / « versé ».
function entryDetail(entry: SellerPayoutEntry): string {
    const buyer = entry.buyerName ? ` de ${entry.buyerName}` : '';
    switch (entry.expectation) {
        case 'SCHEDULED':
            return entry.expectedAt
                ? `Attendu le ${formatDateFr(entry.expectedAt)} — à la livraison de la commande${buyer}.`
                : `À la livraison de la commande${buyer}.`;
        case 'IMMINENT':
            return 'Versement en cours — le virement part sous 24 h.';
        default:
            return `${PAYOUT_EXPECTATION_LABEL.ON_HOLD} — litige ou retour en cours. Le versement reprend après résolution.`;
    }
}
