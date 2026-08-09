'use client';

import { useState } from 'react';
import { AlertTriangle, Gavel, Loader2, ShieldCheck } from 'lucide-react';
import type { SellerOrder } from '@lumiris/api-client';
import { ORDER_STATUS_LABEL_SELLER } from '@lumiris/api-client';
import { useOpenDisputes, useResolveDispute } from '@lumiris/api-client/react';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import { Skeleton } from '@lumiris/ui/components/skeleton';
import { toast } from '@lumiris/ui/components/sonner';
import { formatDateFr, formatPriceCents } from '@lumiris/utils';
import { DisputeThread } from './dispute-thread';
import { ResolveDisputeDialog } from './resolve-dialog';

// File d'arbitrage : le plus ancien litige d'abord. Chaque dossier porte tout ce qu'il faut pour
// trancher — montants, suivi, motif et historique complet des transitions.
export function Disputes() {
    const { data: disputes = [], isLoading } = useOpenDisputes();
    const [selected, setSelected] = useState<SellerOrder | null>(null);

    if (isLoading) {
        return (
            <div className="space-y-3 p-8">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }

    if (disputes.length === 0) {
        return (
            <div className="flex flex-col items-center gap-3 p-16 text-center">
                <ShieldCheck className="h-10 w-10 text-lumiris-emerald/60" strokeWidth={1.25} aria-hidden />
                <p className="text-base font-semibold text-foreground">Aucun litige ouvert</p>
                <p className="max-w-md text-sm text-muted-foreground">
                    Les litiges ouverts par des acheteurs arrivent ici pour arbitrage.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-8">
            <p className="text-sm text-muted-foreground">
                {disputes.length} litige{disputes.length > 1 ? 's' : ''} en attente d’arbitrage — le plus ancien
                d’abord.
            </p>

            {disputes.map((dispute) => (
                <DisputeCard key={dispute.id} dispute={dispute} onResolve={() => setSelected(dispute)} />
            ))}

            {selected ? <ResolveDisputeDialog dispute={selected} open onOpenChange={() => setSelected(null)} /> : null}
        </div>
    );
}

function DisputeCard({ dispute, onResolve }: { dispute: SellerOrder; onResolve: () => void }) {
    const resolveMutation = useResolveDispute();
    const currency = dispute.currency ?? 'EUR';
    const charged = dispute.amountTotalCents + (dispute.shippingCents ?? 0);

    const rejectDispute = () =>
        resolveMutation.mutate(
            { orderId: dispute.id, input: { resolution: 'Litige clos : la commande est conforme à l’annonce.' } },
            {
                onSuccess: () => toast.success('Litige clos sans remboursement.'),
                onError: (e) => toast.error(e.message || 'Arbitrage impossible.'),
            },
        );

    return (
        <Card>
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                <div className="min-w-0">
                    <CardTitle className="text-base">{dispute.productName ?? 'Commande'}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {dispute.buyerName ?? 'Acheteur'} · {formatPriceCents(charged, currency)} ·{' '}
                        {ORDER_STATUS_LABEL_SELLER[dispute.status]}
                    </p>
                </div>
                <Badge variant="destructive" className="shrink-0">
                    Ouvert le {formatDateFr(dispute.createdAt)}
                </Badge>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
                    <p className="text-foreground">{dispute.disputeReason ?? 'Motif non précisé.'}</p>
                </div>

                <dl className="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
                    <Fact label="Débité à l’acheteur" value={formatPriceCents(charged, currency)} />
                    <Fact label="Net atelier" value={formatPriceCents(dispute.netCents, currency)} />
                    <Fact
                        label="Fonds"
                        value={dispute.released ? `Versés le ${formatDateFr(dispute.releasedAt)}` : 'Retenus'}
                    />
                    <Fact
                        label="Suivi"
                        value={
                            dispute.trackingNumber ? `${dispute.carrier} · ${dispute.trackingNumber}` : 'Non expédiée'
                        }
                    />
                </dl>

                <DisputeThread dispute={dispute} />

                <details className="rounded-lg border border-border">
                    <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground">
                        Historique complet ({dispute.timeline.length} évènements)
                    </summary>
                    <ul className="space-y-1.5 border-t border-border px-3 py-2">
                        {dispute.timeline.map((event) => (
                            <li key={event.id} className="text-xs text-muted-foreground">
                                <span className="font-mono">{formatDateFr(event.createdAt)}</span> · {event.actorType} ·{' '}
                                {event.type}
                                {event.message ? ` — ${event.message}` : ''}
                            </li>
                        ))}
                    </ul>
                </details>

                <div className="flex flex-wrap gap-2">
                    <Button onClick={onResolve} className="gap-1.5 bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90">
                        <Gavel className="h-4 w-4" /> Trancher en faveur de l’acheteur
                    </Button>
                    <Button variant="outline" disabled={resolveMutation.isPending} onClick={rejectDispute}>
                        {resolveMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                        Clore sans remboursement
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function Fact({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
        </div>
    );
}
