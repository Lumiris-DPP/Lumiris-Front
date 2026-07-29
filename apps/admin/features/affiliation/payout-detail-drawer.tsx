'use client';

import { useMemo } from 'react';
import { CheckCircle2, ShieldOff } from 'lucide-react';
import type { AffiliationEvent, Payout } from '@lumiris/types';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { DetailDrawer } from '@lumiris/ui/components/detail-drawer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { Textarea } from '@lumiris/ui/components/textarea';
import { cn } from '@lumiris/ui/lib/cn';
import { useAdminAuditLog } from '@/lib/auth';
import { BANK_STATUS_LABEL, BANK_STATUS_TONE, inferExpectedDate, type BankStatus } from './types';

interface PayoutDetailDrawerProps {
    payout: Payout | null;
    events: readonly AffiliationEvent[];
    bankStatus: BankStatus;
    canPrepare: boolean;
    comment: string;
    onCommentChange: (value: string) => void;
    onReconcile: () => void;
    onReject: () => void;
    onClose: () => void;
}

export function PayoutDetailDrawer({
    payout,
    events,
    bankStatus,
    canPrepare,
    comment,
    onCommentChange,
    onReconcile,
    onReject,
    onClose,
}: PayoutDetailDrawerProps) {
    const auditLog = useAdminAuditLog();

    const beneficiaries = useMemo(() => {
        if (!payout) return [] as ReadonlyArray<{ id: string; name: string; total: number; count: number }>;
        const periodEvents = events.filter((e) => new Date(e.occurredAt).toISOString().slice(0, 7) === payout.period);
        const map = new Map<string, { name: string; total: number; count: number }>();
        for (const e of periodEvents) {
            const cur = map.get(e.beneficiaryId) ?? { name: e.beneficiaryDisplayName, total: 0, count: 0 };
            cur.total += e.commission.amountEur;
            cur.count += 1;
            map.set(e.beneficiaryId, cur);
        }
        return Array.from(map.entries())
            .map(([id, info]) => ({ id, ...info }))
            .sort((a, b) => b.total - a.total);
    }, [payout, events]);

    const auditEntries = useMemo(() => {
        if (!payout) return [];
        return auditLog.filter(
            (entry) =>
                (entry.targetType === 'payout' && entry.targetId === payout.id) ||
                (entry.targetType === 'period' && entry.targetId === payout.period),
        );
    }, [auditLog, payout]);

    if (!payout) {
        return <DetailDrawer open={false} onOpenChange={onClose} title="" />;
    }

    const expected = inferExpectedDate(payout);

    const detailContent = (
        <div className="flex flex-col gap-5">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                <div>
                    <dt className="text-[10px] tracking-wider text-muted-foreground uppercase">Référence</dt>
                    <dd className="mt-0.5 font-mono text-foreground">{payout.id}</dd>
                </div>
                <div>
                    <dt className="text-[10px] tracking-wider text-muted-foreground uppercase">Statut bancaire</dt>
                    <dd className="mt-0.5">
                        <Badge variant="outline" className={cn('font-mono text-[10px]', BANK_STATUS_TONE[bankStatus])}>
                            {BANK_STATUS_LABEL[bankStatus]}
                        </Badge>
                    </dd>
                </div>
                <div>
                    <dt className="text-[10px] tracking-wider text-muted-foreground uppercase">Montant total</dt>
                    <dd className="mt-0.5 font-mono text-base font-semibold text-lumiris-emerald">
                        {payout.totalEur.toFixed(2)} €
                    </dd>
                </div>
                <div>
                    <dt className="text-[10px] tracking-wider text-muted-foreground uppercase">Bénéficiaires</dt>
                    <dd className="mt-0.5 font-mono text-foreground">{payout.beneficiaryCount}</dd>
                </div>
                <div>
                    <dt className="text-[10px] tracking-wider text-muted-foreground uppercase">Préparé le</dt>
                    <dd className="mt-0.5 font-mono text-foreground">
                        {payout.preparedAt ? new Date(payout.preparedAt).toLocaleDateString('fr-FR') : '—'}
                    </dd>
                </div>
                <div>
                    <dt className="text-[10px] tracking-wider text-muted-foreground uppercase">Date prévue</dt>
                    <dd className="mt-0.5 font-mono text-foreground">
                        {new Date(expected).toLocaleDateString('fr-FR')}
                    </dd>
                </div>
                <div>
                    <dt className="text-[10px] tracking-wider text-muted-foreground uppercase">Événements exclus</dt>
                    <dd className="mt-0.5 font-mono text-foreground">{payout.excludedEventIds.length}</dd>
                </div>
            </dl>

            <section>
                <p className="mb-2 text-xs font-medium text-foreground">Répartition par bénéficiaire</p>
                <div className="overflow-hidden rounded-lg border border-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Bénéficiaire</TableHead>
                                <TableHead className="text-right">Conversions</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {beneficiaries.map((b) => (
                                <TableRow key={b.id}>
                                    <TableCell>
                                        <p className="text-sm text-foreground">{b.name}</p>
                                        <p className="text-[10px] text-muted-foreground">{b.id}</p>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">{b.count}</TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                        {b.total.toFixed(2)} €
                                    </TableCell>
                                </TableRow>
                            ))}
                            {beneficiaries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="py-4 text-center text-xs text-muted-foreground">
                                        Aucun bénéficiaire enregistré sur la période.
                                    </TableCell>
                                </TableRow>
                            ) : null}
                        </TableBody>
                    </Table>
                </div>
            </section>

            <section>
                <p className="mb-2 text-xs font-medium text-foreground">Commentaire interne</p>
                <Textarea
                    value={comment}
                    onChange={(e) => onCommentChange(e.target.value)}
                    placeholder="Notes internes (validation comptable, anomalie remontée…)"
                    className="min-h-20 text-xs"
                />
            </section>
        </div>
    );

    const auditContent = (
        <ul className="space-y-2 text-xs">
            {auditEntries.length === 0 ? (
                <li className="text-muted-foreground italic">Aucune entrée d&apos;audit pour ce payout.</li>
            ) : (
                auditEntries.map((entry) => (
                    <li key={entry.id} className="rounded-lg border border-border bg-card p-3">
                        <div className="flex items-baseline justify-between gap-2">
                            <p className="font-mono text-[11px] text-foreground">{entry.action}</p>
                            <p className="font-mono text-[10px] text-muted-foreground">
                                {new Date(entry.ts).toLocaleString('fr-FR')}
                            </p>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                            {entry.actorId} · {entry.actorRole}
                        </p>
                    </li>
                ))
            )}
        </ul>
    );

    const footer = (
        <div className="flex items-center justify-end gap-2">
            {canPrepare && bankStatus !== 'reconciled' ? (
                <Button size="sm" variant="outline" onClick={onReconcile} className="gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Marquer payé
                </Button>
            ) : null}
            {canPrepare && bankStatus !== 'failed' ? (
                <Button size="sm" variant="outline" onClick={onReject} className="gap-1.5">
                    <ShieldOff className="h-3.5 w-3.5" /> Marquer rejeté
                </Button>
            ) : null}
        </div>
    );

    return (
        <DetailDrawer
            open
            onOpenChange={(o) => !o && onClose()}
            title={`Payout ${payout.period}`}
            subtitle={`${payout.totalEur.toFixed(2)} € · ${payout.beneficiaryCount} bénéficiaires`}
            tabs={[
                { value: 'detail', label: 'Détail', content: detailContent },
                { value: 'audit', label: 'Audit log', content: auditContent },
            ]}
            footer={canPrepare ? footer : undefined}
            width="md"
        />
    );
}
