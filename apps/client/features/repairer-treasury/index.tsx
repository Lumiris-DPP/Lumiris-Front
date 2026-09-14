'use client';

import { CalendarClock, ExternalLink, Loader2, PauseCircle, Wallet } from 'lucide-react';
import { useRepairerPayouts, useSellerStatus, useStartSellerOnboarding } from '@lumiris/api-client/react';
import type { RepairPayoutEntry } from '@lumiris/api-client';
import { Button } from '@lumiris/ui/components/button';
import { Skeleton } from '@lumiris/ui/components/skeleton';
import { StatCard } from '@lumiris/ui/components/stat-card';
import { toast } from '@lumiris/ui/components/sonner';
import { formatDateFr, formatPriceCents } from '@lumiris/utils';
import { useAuthStore } from '@/lib/auth-store';

const PAYOUT_EXPECTATION_LABEL: Record<string, string> = {
    SCHEDULED: 'Prévu',
    IMMINENT: 'Versement en cours',
    ON_HOLD: 'Suspendu',
};

export function RepairerTreasury() {
    const { data, isLoading, error } = useRepairerPayouts();

    return (
        <div className="space-y-4 p-4 md:p-8">
            <SellerConnectBanner />

            {isLoading ? (
                <div className="space-y-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : error ? (
                <p className="text-sm text-destructive">Erreur : {error.message}</p>
            ) : data ? (
                <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <StatCard
                            label="En attente"
                            value={formatPriceCents(data.scheduledCents, data.currency ?? 'EUR')}
                            hint="Devis payés, intervention pas encore terminée"
                            icon={CalendarClock}
                        />
                        <StatCard
                            label="Versé sur votre compte"
                            value={formatPriceCents(data.releasedCents, data.currency ?? 'EUR')}
                            hint="Virements déjà partis, net de commission"
                            icon={Wallet}
                        />
                        <StatCard
                            label="Suspendus"
                            value={formatPriceCents(data.onHoldCents, data.currency ?? 'EUR')}
                            hint="Terminé, virement en cours ou litige"
                            icon={PauseCircle}
                        />
                    </div>

                    {data.entries.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucun versement en attente.</p>
                    ) : (
                        <ul className="divide-y divide-border rounded-xl border border-border">
                            {data.entries.map((entry) => (
                                <li key={entry.requestId} className="flex flex-wrap items-center gap-3 p-4">
                                    <div className="min-w-56 flex-1">
                                        <p className="text-sm font-medium text-foreground">
                                            {entry.productName ?? 'Passeport'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{entryDetail(entry)}</p>
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {PAYOUT_EXPECTATION_LABEL[entry.expectation]}
                                    </span>
                                    <p className="w-28 text-right text-sm font-semibold text-foreground tabular-nums">
                                        {formatPriceCents(entry.netCents, entry.currency ?? 'EUR')}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            ) : null}
        </div>
    );
}

function entryDetail(entry: RepairPayoutEntry): string {
    const client = entry.consumerName ? ` de ${entry.consumerName}` : '';
    switch (entry.expectation) {
        case 'IMMINENT':
            return 'Intervention terminée — le virement part sous 24 h.';
        case 'ON_HOLD':
            return 'Suspendu — reprend après résolution.';
        default:
            return `En attente de la fin de l'intervention${client}.`;
    }
}

// Même bandeau que côté artisan (SellerConnectBanner) — mêmes hooks, même onboarding Stripe
// Connect : la plateforme ne distingue pas artisan/retoucheur pour être payée.
function SellerConnectBanner() {
    const token = useAuthStore((s) => s.token);
    const { data: status } = useSellerStatus({ enabled: Boolean(token) });
    const onboarding = useStartSellerOnboarding();

    if (!token || status?.chargesEnabled) return null;

    const activate = () =>
        onboarding.mutate(undefined, {
            onSuccess: ({ url }) => {
                window.location.href = url;
            },
            onError: () => toast.error("Impossible d'ouvrir l'onboarding des paiements."),
        });

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-lumiris-amber/40 bg-lumiris-amber/10 p-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm">
                <p className="font-medium text-foreground">Activez les paiements pour être réglé</p>
                <p className="text-xs text-muted-foreground">
                    Tant que Stripe Connect n&apos;est pas activé, vos devis réglés restent en attente — commission
                    plateforme d&apos;environ 5 %, versement net dès l&apos;intervention terminée.
                </p>
            </div>
            <Button
                onClick={activate}
                disabled={onboarding.isPending}
                className="shrink-0 gap-1.5 bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90"
            >
                {onboarding.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <ExternalLink className="h-4 w-4" />
                )}
                Activer les paiements
            </Button>
        </div>
    );
}
