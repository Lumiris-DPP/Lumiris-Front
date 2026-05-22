'use client';

import { useMemo, useState } from 'react';
import { ArrowDownToLine, Landmark } from 'lucide-react';
import type { AffiliationEvent, Payout } from '@lumiris/types';
import { Button } from '@lumiris/ui/components/button';
import { DataTableFilters } from '@lumiris/ui/components/data-table-filters';
import { useLogAction, usePermission } from '@/lib/auth';
import { NOW_REF, type SuspiciousFlag } from '@/lib/affiliation-fraud';
import { usePagination } from '../_shared/use-pagination';
import { PayoutDetailDrawer } from './payout-detail-drawer';
import { PayoutsPrepareDrawer, type PayoutBeneficiaryPreview } from './payouts-prepare-drawer';
import { PayoutsTable } from './payouts-table';
import { inferBankStatus, type BankStatus } from './types';

const STATUS_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
    { value: 'awaiting', label: 'En attente' },
    { value: 'all', label: 'Historique' },
    { value: 'reconciled', label: 'Payé' },
    { value: 'wire_sent', label: 'Virement émis' },
    { value: 'failed', label: 'Rejeté' },
];

function payoutTimestamp(p: Payout): number {
    if (p.paidAt) return new Date(p.paidAt).getTime();
    if (p.preparedAt) return new Date(p.preparedAt).getTime();
    return NOW_REF;
}

interface PayoutsTabProps {
    payouts: readonly Payout[];
    events: readonly AffiliationEvent[];
    suspicions: ReadonlyMap<string, SuspiciousFlag>;
    bankStatuses: ReadonlyMap<string, BankStatus>;
    comments: ReadonlyMap<string, string>;
    onUpdateBankStatus: (id: string, status: BankStatus) => void;
    onUpdateComment: (id: string, value: string) => void;
    onPreparePayout: (eventIds: readonly string[]) => void;
}

export function PayoutsTab({
    payouts,
    events,
    suspicions,
    bankStatuses,
    comments,
    onUpdateBankStatus,
    onUpdateComment,
    onPreparePayout,
}: PayoutsTabProps) {
    const log = useLogAction();
    const canPrepare = usePermission('affiliation.prepare_payout');

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<BankStatus | 'all'>('awaiting');
    const [openPayoutId, setOpenPayoutId] = useState<string | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const currentPeriodStats = useMemo(() => {
        const pending = events.filter((e) => e.payoutStatus === 'pending');
        const eligible = pending.filter((e) => !e.flaggedAsFraud && !suspicions.has(e.id));
        const excluded = pending.filter((e) => e.flaggedAsFraud || suspicions.has(e.id));
        const total = eligible.reduce((s, e) => s + e.commission.amountEur, 0);
        const beneficiaryCount = new Set(eligible.map((e) => e.beneficiaryId)).size;
        const byBeneficiary = new Map<string, PayoutBeneficiaryPreview>();
        for (const e of eligible) {
            const cur =
                byBeneficiary.get(e.beneficiaryId) ??
                ({
                    id: e.beneficiaryId,
                    name: e.beneficiaryDisplayName,
                    amountEur: 0,
                    eventCount: 0,
                } satisfies PayoutBeneficiaryPreview);
            cur.amountEur += e.commission.amountEur;
            cur.eventCount += 1;
            byBeneficiary.set(e.beneficiaryId, cur);
        }
        const beneficiaries = Array.from(byBeneficiary.values()).sort((a, b) => b.amountEur - a.amountEur);
        return { eligible, excluded, total, beneficiaryCount, beneficiaries };
    }, [events, suspicions]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return payouts.filter((p) => {
            const status = bankStatuses.get(p.id) ?? inferBankStatus(p);
            if (statusFilter !== 'all' && status !== statusFilter) return false;
            if (q && !p.id.toLowerCase().includes(q) && !p.period.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [payouts, bankStatuses, statusFilter, search]);

    const filteredTotal = useMemo(() => filtered.reduce((s, p) => s + p.totalEur, 0), [filtered]);
    const pagination = usePagination(filtered, 25);
    const openPayout = openPayoutId ? (payouts.find((p) => p.id === openPayoutId) ?? null) : null;

    const handleConfirmPrepare = () => {
        const month = '2026-04';
        log({
            action: 'affiliation.prepare_payout',
            targetType: 'period',
            targetId: month,
            payload: {
                mois: month,
                totalEuros: +currentPeriodStats.total.toFixed(2),
                nbBeneficiaires: currentPeriodStats.beneficiaryCount,
                exclusions: currentPeriodStats.excluded.map((e) => e.id),
            },
        });
        if (typeof window !== 'undefined') {
            const header = ['eventId', 'beneficiaryId', 'beneficiaryName', 'kind', 'amountEur'].join(',');
            const lines = currentPeriodStats.eligible.map((e) =>
                [e.id, e.beneficiaryId, e.beneficiaryDisplayName, e.kind, e.commission.amountEur.toFixed(2)]
                    .map((v) => String(v).replace(/,/g, ';'))
                    .join(','),
            );
            const csv = `${header}\n${lines.join('\n')}`;
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lumiris-payout-${month}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }
        onPreparePayout(currentPeriodStats.eligible.map((e) => e.id));
        setConfirmOpen(false);
    };

    const setBankStatus = (payout: Payout, status: BankStatus) => {
        const previous = bankStatuses.get(payout.id) ?? inferBankStatus(payout);
        onUpdateBankStatus(payout.id, status);
        log({
            action: 'affiliation.payout_reconcile',
            targetType: 'payout',
            targetId: payout.id,
            payload: {
                period: payout.period,
                totalEur: payout.totalEur,
                beneficiaryCount: payout.beneficiaryCount,
                previousStatus: previous,
                newStatus: status,
            },
        });
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="border-border bg-card flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
                <div className="inline-flex items-center gap-4 text-sm">
                    <Landmark className="text-muted-foreground h-4 w-4" aria-hidden />
                    <span className="text-foreground font-semibold">Avril 2026</span>
                    <span className="text-muted-foreground font-mono text-xs">
                        {currentPeriodStats.beneficiaryCount} bénéf · {currentPeriodStats.eligible.length} elig ·{' '}
                        {currentPeriodStats.excluded.length} excl
                    </span>
                    <span className="text-lumiris-emerald font-mono text-base font-bold">
                        {currentPeriodStats.total.toFixed(2)} €
                    </span>
                </div>
                <Button
                    size="sm"
                    disabled={!canPrepare || currentPeriodStats.eligible.length === 0}
                    onClick={() => setConfirmOpen(true)}
                    className="gap-1.5"
                >
                    <ArrowDownToLine className="h-3.5 w-3.5" /> Préparer payout
                </Button>
            </div>

            <div className="flex flex-col gap-3">
                <DataTableFilters
                    search={{ value: search, onChange: setSearch, placeholder: 'Rechercher période ou réf…' }}
                    filters={[
                        {
                            label: 'Statut',
                            value: statusFilter,
                            onChange: (v) => setStatusFilter(v as BankStatus | 'all'),
                            options: STATUS_OPTIONS,
                        },
                    ]}
                    onReset={() => {
                        setSearch('');
                        setStatusFilter('awaiting');
                    }}
                />
                <p className="text-muted-foreground text-[11px]">
                    Total : <strong className="text-foreground font-mono">{filteredTotal.toFixed(2)} €</strong> ·{' '}
                    {filtered.length} payout(s).
                </p>
            </div>

            <PayoutsTable
                rows={filtered}
                bankStatuses={bankStatuses}
                onOpen={setOpenPayoutId}
                pagination={pagination}
                totalCount={filtered.length}
                dateLabel={(p) => new Date(payoutTimestamp(p)).toLocaleDateString('fr-FR')}
            />

            <PayoutsPrepareDrawer
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                onConfirm={handleConfirmPrepare}
                period="avril 2026"
                totalEur={currentPeriodStats.total}
                beneficiaryCount={currentPeriodStats.beneficiaryCount}
                excludedCount={currentPeriodStats.excluded.length}
                beneficiaries={currentPeriodStats.beneficiaries}
            />

            <PayoutDetailDrawer
                payout={openPayout}
                events={events}
                bankStatus={openPayout ? (bankStatuses.get(openPayout.id) ?? inferBankStatus(openPayout)) : 'awaiting'}
                canPrepare={canPrepare}
                comment={openPayout ? (comments.get(openPayout.id) ?? '') : ''}
                onCommentChange={(value) => openPayout && onUpdateComment(openPayout.id, value)}
                onReconcile={() => openPayout && setBankStatus(openPayout, 'reconciled')}
                onReject={() => openPayout && setBankStatus(openPayout, 'failed')}
                onClose={() => setOpenPayoutId(null)}
            />
        </div>
    );
}
