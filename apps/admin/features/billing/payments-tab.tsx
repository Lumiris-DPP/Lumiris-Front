'use client';

import { useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import { mockPaymentHistory, mockSubscriptions } from '@lumiris/mock-data';
import type { Subscription } from '@lumiris/types';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { DataTableFilters } from '@lumiris/ui/components/data-table-filters';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@lumiris/ui/components/dialog';
import { Label } from '@lumiris/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { cn } from '@lumiris/ui/lib/cn';
import { useLogAction, usePermission } from '@/lib/auth';
import { formatEur } from '@/lib/pricing';
import { EmptyState } from '../_shared/empty-state';
import { PaginationBar } from '../_shared/pagination-bar';
import { usePagination } from '../_shared/use-pagination';
import { openInvoiceWindow } from './print-invoice';
import { statusBadgeProps } from './status';
import type { PaymentPeriodFilter, PaymentStatusFilter, SubscriberKindFilter } from './types';

const STATUS_OPTIONS: ReadonlyArray<{ value: PaymentStatusFilter; label: string }> = [
    { value: 'all', label: 'Tous statuts' },
    { value: 'succeeded', label: 'Réussis' },
    { value: 'failed', label: 'Échoués' },
    { value: 'refunded', label: 'Remboursés' },
];

const PERIOD_OPTIONS: ReadonlyArray<{ value: PaymentPeriodFilter; label: string }> = [
    { value: '30d', label: '30 jours' },
    { value: '90d', label: '90 jours' },
    { value: '12m', label: '12 mois' },
    { value: 'all', label: 'Tout' },
];

const KIND_OPTIONS: ReadonlyArray<{ value: SubscriberKindFilter; label: string }> = [
    { value: 'all', label: 'Tous acteurs' },
    { value: 'artisan', label: 'Artisans' },
    { value: 'repairer', label: 'Retoucheurs' },
];

const PERIOD_MS: Record<PaymentPeriodFilter, number> = {
    '30d': 30 * 86_400_000,
    '90d': 90 * 86_400_000,
    '12m': 365 * 86_400_000,
    all: Number.POSITIVE_INFINITY,
};

export function PaymentsTab() {
    const canIssueInvoice = usePermission('billing.invoice_issue');
    const [search, setSearch] = useState('');
    const [statusF, setStatusF] = useState<PaymentStatusFilter>('all');
    const [kind, setKind] = useState<SubscriberKindFilter>('all');
    const [period, setPeriod] = useState<PaymentPeriodFilter>('12m');
    const [issueOpen, setIssueOpen] = useState(false);

    const rows = useMemo(() => {
        const now = Date.now();
        const cutoff = PERIOD_MS[period];
        return mockPaymentHistory.filter((p) => {
            if (statusF !== 'all' && p.status !== statusF) return false;
            if (kind !== 'all' && p.subscriberKind !== kind) return false;
            if (now - new Date(p.chargedAt).getTime() > cutoff) return false;
            if (
                search.trim() &&
                !p.displayName.toLowerCase().includes(search.toLowerCase()) &&
                !p.id.toLowerCase().includes(search.toLowerCase())
            ) {
                return false;
            }
            return true;
        });
    }, [search, statusF, kind, period]);

    const pagination = usePagination(rows, 25);

    function reset() {
        setSearch('');
        setStatusF('all');
        setKind('all');
        setPeriod('12m');
    }

    const advancedActiveCount = (kind !== 'all' ? 1 : 0) + (period !== '12m' ? 1 : 0);

    return (
        <div className="space-y-4">
            <DataTableFilters
                search={{ value: search, onChange: setSearch, placeholder: 'Référence ou nom…' }}
                filters={[
                    {
                        label: 'Statut',
                        value: statusF,
                        onChange: (v) => setStatusF(v as PaymentStatusFilter),
                        options: [...STATUS_OPTIONS],
                    },
                ]}
                onReset={reset}
                advanced={{
                    activeCount: advancedActiveCount,
                    children: (
                        <>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Acteur</Label>
                                <Select value={kind} onValueChange={(v) => setKind(v as SubscriberKindFilter)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Acteur" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {KIND_OPTIONS.map((o) => (
                                            <SelectItem key={o.value} value={o.value}>
                                                {o.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Période</Label>
                                <Select value={period} onValueChange={(v) => setPeriod(v as PaymentPeriodFilter)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Période" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PERIOD_OPTIONS.map((o) => (
                                            <SelectItem key={o.value} value={o.value}>
                                                {o.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    ),
                }}
                rightSlot={
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={!canIssueInvoice}
                        onClick={() => setIssueOpen(true)}
                        className="gap-1.5"
                    >
                        <FileText className="h-3.5 w-3.5" /> Émettre une facture
                    </Button>
                }
            />

            {rows.length === 0 ? (
                <EmptyState
                    title="Aucun paiement ne correspond aux filtres"
                    description="Élargissez la période ou réinitialisez les filtres pour explorer l'historique."
                />
            ) : (
                <div className="border-border bg-card overflow-hidden rounded-xl border">
                    <Table>
                        <TableHeader stickyHeader>
                            <TableRow>
                                <TableHead>Réf</TableHead>
                                <TableHead>Payeur</TableHead>
                                <TableHead className="text-right">Montant</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pagination.pageItems.map((p) => {
                                const s = statusBadgeProps(p.status);
                                return (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-mono text-[11px]">{p.id}</TableCell>
                                        <TableCell>
                                            <p className="text-foreground text-sm">{p.displayName}</p>
                                            <p className="text-muted-foreground text-[10px]">
                                                {p.subscriberKind === 'artisan' ? 'Artisan' : 'Retoucheur'} ·{' '}
                                                {p.subscriberId}
                                            </p>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {formatEur(p.amountEur)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={s.variant}
                                                className={cn('font-mono text-[10px]', s.className)}
                                            >
                                                {s.label}
                                            </Badge>
                                            {p.failureReason ? (
                                                <span className="text-muted-foreground ml-2 font-mono text-[10px]">
                                                    {p.failureReason}
                                                </span>
                                            ) : null}
                                        </TableCell>
                                        <TableCell className="font-mono text-[11px]">
                                            {new Date(p.chargedAt).toLocaleDateString('fr-FR')}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    <PaginationBar
                        page={pagination.page}
                        pageCount={pagination.pageCount}
                        pageSize={pagination.pageSize}
                        rangeStart={pagination.rangeStart}
                        rangeEnd={pagination.rangeEnd}
                        totalCount={rows.length}
                        onPageChange={pagination.setPage}
                        onPageSizeChange={pagination.setPageSize}
                        pageSizeOptions={[25, 50, 100]}
                        label="paiements"
                    />
                </div>
            )}

            <IssueInvoiceDialog open={issueOpen} onClose={() => setIssueOpen(false)} />
        </div>
    );
}

function IssueInvoiceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const log = useLogAction();
    const [subId, setSubId] = useState<string>('');
    const candidates = useMemo(() => mockSubscriptions.filter((s) => s.tier !== 'free'), []);

    function handleConfirm() {
        const sub = candidates.find((s) => s.id === subId);
        if (!sub) return;
        log({
            action: 'billing.invoice_issue',
            targetType: 'subscription',
            targetId: sub.id,
            payload: {
                tier: sub.tier,
                plus: sub.plus,
                mrr: sub.mrrEur,
                kind: sub.subscriberKind,
                source: 'payments_tab',
            },
        });
        openInvoiceWindow(sub);
        onClose();
        setSubId('');
    }

    return (
        <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Émettre une facture</DialogTitle>
                    <DialogDescription>Sélectionner un abonnement pour générer la facture (PDF).</DialogDescription>
                </DialogHeader>
                <Select value={subId} onValueChange={setSubId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Choisir un abonnement…" />
                    </SelectTrigger>
                    <SelectContent>
                        {candidates.map((s: Subscription) => (
                            <SelectItem key={s.id} value={s.id}>
                                {s.displayName} · {formatEur(s.mrrEur)}/mois
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <DialogFooter>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        Annuler
                    </Button>
                    <Button size="sm" disabled={!subId} onClick={handleConfirm}>
                        Générer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
