'use client';

import { ChevronRight, Filter } from 'lucide-react';
import type { Payout } from '@lumiris/types';
import { Badge } from '@lumiris/ui/components/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { cn } from '@lumiris/ui/lib/cn';
import { EmptyState } from '../_shared/empty-state';
import { PaginationBar } from '../_shared/pagination-bar';
import { BANK_STATUS_LABEL, BANK_STATUS_TONE, inferBankStatus, type BankStatus } from './types';

interface PayoutsTableProps {
    rows: readonly Payout[];
    bankStatuses: ReadonlyMap<string, BankStatus>;
    onOpen: (id: string) => void;
    pagination: {
        page: number;
        pageCount: number;
        pageSize: number;
        pageItems: readonly Payout[];
        rangeStart: number;
        rangeEnd: number;
        setPage: (n: number) => void;
    };
    totalCount: number;
    dateLabel: (p: Payout) => string;
}

export function PayoutsTable({ rows, bankStatuses, onOpen, pagination, totalCount, dateLabel }: PayoutsTableProps) {
    if (rows.length === 0) {
        return (
            <EmptyState
                icon={Filter}
                title="Aucun payout ne correspond aux filtres"
                description="Élargissez la période ou réinitialisez les filtres pour explorer l'historique."
            />
        );
    }
    return (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
                <TableHeader stickyHeader>
                    <TableRow>
                        <TableHead>Référence</TableHead>
                        <TableHead className="text-right">Bénéficiaires</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead aria-label="Ouvrir" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pagination.pageItems.map((p) => {
                        const status = bankStatuses.get(p.id) ?? inferBankStatus(p);
                        return (
                            <TableRow
                                key={p.id}
                                className="cursor-pointer hover:bg-muted/40"
                                onClick={() => onOpen(p.id)}
                                tabIndex={0}
                                role="button"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onOpen(p.id);
                                    }
                                }}
                            >
                                <TableCell>
                                    <p className="font-mono text-sm text-foreground">{p.period}</p>
                                    <p className="text-[10px] text-muted-foreground">{p.id}</p>
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm">{p.beneficiaryCount}</TableCell>
                                <TableCell className="font-mono text-[11px]">{dateLabel(p)}</TableCell>
                                <TableCell className="text-right font-mono text-sm">
                                    {p.totalEur.toFixed(2)} €
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={cn('font-mono text-[10px]', BANK_STATUS_TONE[status])}
                                    >
                                        {BANK_STATUS_LABEL[status]}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
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
                totalCount={totalCount}
                onPageChange={pagination.setPage}
                label="payouts"
            />
        </div>
    );
}
