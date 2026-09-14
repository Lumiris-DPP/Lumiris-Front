'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Inbox } from 'lucide-react';
import type { RepairRequestStatus } from '@lumiris/api-client';
import { useRepairerMe, useRepairerRequests } from '@lumiris/api-client/react';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import { StatCard } from '@lumiris/ui/components/stat-card';
import { formatDateFr, formatPriceCents } from '@lumiris/utils';

const STATUS_LABEL: Record<RepairRequestStatus, string> = {
    PENDING: 'Nouvelle demande',
    DRAFT: 'Devis envoyé',
    ACCEPTED: 'Accepté',
    REFUSED: 'Refusé',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Terminé',
};

function greeting(name: string): string {
    const firstName = name.split(' ')[0] ?? name;
    return `Bonjour ${firstName}`;
}

export function RepairerDashboard() {
    const { data: repairer, isLoading: repairerLoading } = useRepairerMe();
    const { data: requests = [], isLoading: requestsLoading } = useRepairerRequests();

    const stats = useMemo(() => {
        const inProgress = requests.filter((r) => r.status === 'ACCEPTED' || r.status === 'IN_PROGRESS').length;
        const completed = requests.filter((r) => r.status === 'COMPLETED').length;
        const generatedCents = requests.filter((r) => r.paidAt).reduce((sum, r) => sum + (r.quoteAmountCents ?? 0), 0);
        return { total: requests.length, inProgress, completed, generatedCents };
    }, [requests]);

    const recent = useMemo(
        () => [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
        [requests],
    );

    if (repairerLoading || requestsLoading) {
        return <p className="p-8 text-sm text-muted-foreground">Chargement…</p>;
    }
    if (!repairer) {
        return <p className="p-8 text-sm text-muted-foreground">Profil indisponible.</p>;
    }

    return (
        <div className="space-y-6 p-8">
            <p className="text-lg font-medium text-foreground">
                {greeting(repairer.displayName ?? repairer.companyName ?? 'à vous')}
            </p>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Demandes reçues" value={String(stats.total)} hint="Depuis le début" />
                <StatCard label="En cours" value={String(stats.inProgress)} hint="Acceptées ou en intervention" />
                <StatCard label="Terminées" value={String(stats.completed)} hint="Interventions closes" />
                <StatCard
                    label="Note moyenne"
                    value={repairer.averageRating ? repairer.averageRating.toFixed(1) : '—'}
                    hint={`${repairer.reviewCount} avis`}
                />
            </section>

            <Card>
                <CardHeader>
                    <CardTitle>Généré via la plateforme</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-semibold text-foreground tabular-nums">
                        {formatPriceCents(stats.generatedCents, 'EUR')}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Total des devis réglés par les clients — le détail (versé, en attente, suspendu) est dans
                        Trésorerie.
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Dernières demandes</CardTitle>
                        <p className="text-xs text-muted-foreground">5 plus récentes</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/repairer-passports">
                            Tout voir <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent className="divide-y divide-border">
                    {recent.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            <Inbox className="mx-auto mb-2 h-6 w-6 opacity-40" />
                            Aucune demande pour l&apos;instant.
                        </p>
                    ) : (
                        recent.map((r) => (
                            <Link
                                key={r.id}
                                href="/repairer-passports"
                                className="-mx-3 flex items-center gap-4 rounded-md px-3 py-3 transition-colors hover:bg-muted/50"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-foreground">
                                        {r.dppProductName ?? 'Passeport'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {r.consumerName ?? 'Client'} · {formatDateFr(r.createdAt)}
                                    </p>
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">
                                    {STATUS_LABEL[r.status]}
                                </span>
                            </Link>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
