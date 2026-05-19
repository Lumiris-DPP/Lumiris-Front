'use client';

import { useMemo } from 'react';
import { mockAffiliationEvents } from '@lumiris/mock-data';
import type { AffiliationEvent } from '@lumiris/types';
import { Badge } from '@lumiris/ui/components/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { TabsContent } from '@lumiris/ui/components/tabs';
import { cn } from '@lumiris/ui/lib/cn';
import {
    COMMISSION_ANONYMIZE_AFTER_DAYS,
    COMMISSION_FLAT_MAX_EUR,
    COMMISSION_FLAT_MIN_EUR,
    COMMISSION_PCT,
    COMMISSION_WINDOW_DAYS,
} from './specialties';

const DAY_MS = 86_400_000;

function ageDays(iso: string, now: number): number {
    return Math.floor((now - new Date(iso).getTime()) / DAY_MS);
}

function maskUser(userId: string, age: number): string {
    if (age < COMMISSION_ANONYMIZE_AFTER_DAYS) return userId;
    const tail = userId.slice(-4);
    return `user_anon_${tail}`;
}

function commissionKind(ev: AffiliationEvent): 'flat' | 'pct' {
    return ev.commission.type === 'flat' ? 'flat' : 'pct';
}

function commissionLabel(ev: AffiliationEvent): string {
    return commissionKind(ev) === 'flat'
        ? `Forfait ${COMMISSION_FLAT_MIN_EUR}–${COMMISSION_FLAT_MAX_EUR} €`
        : `${COMMISSION_PCT} % devis`;
}

interface CommissionsTabProps {
    retoucheurId: string;
}

export function CommissionsTab({ retoucheurId }: CommissionsTabProps) {
    const now = Date.now();
    const rows = useMemo(() => {
        const cutoff = now - COMMISSION_WINDOW_DAYS * DAY_MS;
        return mockAffiliationEvents
            .filter((ev) => ev.beneficiaryKind === 'repairer' && ev.beneficiaryId === retoucheurId)
            .filter((ev) => new Date(ev.occurredAt).getTime() >= cutoff)
            .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
    }, [now, retoucheurId]);

    const total = rows.reduce((acc, ev) => acc + ev.commission.amountEur, 0);

    return (
        <TabsContent value="commissions" className="m-0 space-y-3">
            <div className="border-border bg-card flex items-baseline justify-between rounded-xl border p-3">
                <div>
                    <p className="text-foreground font-medium">Mises en relation — 90 derniers jours</p>
                    <p className="text-muted-foreground mt-0.5 text-[11px]">
                        Forfait {COMMISSION_FLAT_MIN_EUR}–{COMMISSION_FLAT_MAX_EUR} € ou {COMMISSION_PCT} % du devis
                        accepté. Identité VISION anonymisée après {COMMISSION_ANONYMIZE_AFTER_DAYS} jours (RGPD).
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Total période</p>
                    <p className="text-foreground font-mono text-base">{total.toFixed(2)} €</p>
                </div>
            </div>

            {rows.length === 0 ? (
                <div className="border-border bg-card text-muted-foreground rounded-xl border p-6 text-center">
                    Aucune mise en relation enregistrée sur les {COMMISSION_WINDOW_DAYS} derniers jours.
                </div>
            ) : (
                <div className="border-border bg-card overflow-hidden rounded-xl border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>User VISION</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Montant</TableHead>
                                <TableHead>Paiement</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((ev) => {
                                const age = ageDays(ev.occurredAt, now);
                                return (
                                    <TableRow key={ev.id}>
                                        <TableCell className="font-mono text-[11px]">
                                            {ev.occurredAt.slice(0, 10)}
                                        </TableCell>
                                        <TableCell className="font-mono text-[11px]">
                                            {maskUser(ev.userId, age)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono text-[10px]">
                                                {commissionLabel(ev)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-xs">
                                            {ev.commission.amountEur.toFixed(2)} €
                                        </TableCell>
                                        <TableCell>
                                            <PayoutBadge status={ev.payoutStatus} />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </TabsContent>
    );
}

function PayoutBadge({ status }: { status: 'pending' | 'paid' | 'cancelled' }) {
    const { tone, label } =
        status === 'paid'
            ? { tone: 'border-lumiris-emerald/40 bg-lumiris-emerald/10 text-lumiris-emerald', label: 'Versée' }
            : status === 'pending'
              ? { tone: 'border-lumiris-amber/40 bg-lumiris-amber/10 text-lumiris-amber', label: 'En attente' }
              : { tone: 'border-lumiris-rose/40 bg-lumiris-rose/10 text-lumiris-rose', label: 'Annulée' };
    return (
        <Badge variant="outline" className={cn('font-mono text-[10px]', tone)}>
            {label}
        </Badge>
    );
}
