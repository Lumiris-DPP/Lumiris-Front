'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import type { Passport } from '@lumiris/types';
import { IrisGrade as IrisGradeBadge } from '@lumiris/scoring-ui';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Checkbox } from '@lumiris/ui/components/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { cn } from '@lumiris/ui/lib/cn';
import { EmptyState } from '../_shared/empty-state';
import { PaginationBar } from '../_shared/pagination-bar';
import { usePagination } from '../_shared/use-pagination';
import { STATUS_LABEL, STATUS_TONE } from './status';
import type { PassportRow } from './types';

interface PassportTableProps {
    rows: readonly PassportRow[];
    onSelect: (passport: Passport) => void;
    selectedIds: ReadonlySet<string>;
    onToggleSelected: (id: string) => void;
    onToggleAll: (ids: readonly string[], value: boolean) => void;
}

const DAY_MS = 86_400_000;

function relativeDay(iso: string): string {
    const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS);
    if (diffDays <= 0) return "aujourd'hui";
    if (diffDays === 1) return 'hier';
    return `il y a ${diffDays} j`;
}

function ageTone(ageHours: number): string {
    if (ageHours >= 14 * 24) return 'text-lumiris-rose';
    if (ageHours >= 7 * 24) return 'text-lumiris-amber';
    return 'text-muted-foreground';
}

export function PassportTable({ rows, onSelect, selectedIds, onToggleSelected, onToggleAll }: PassportTableProps) {
    const sorted = useMemo(
        () =>
            [...rows].sort(
                (a, b) => new Date(a.passport.createdAt).getTime() - new Date(b.passport.createdAt).getTime(),
            ),
        [rows],
    );
    const pagination = usePagination(sorted, 25);

    if (sorted.length === 0) {
        return (
            <EmptyState
                icon={Users}
                title="Aucun passeport."
                action={
                    <Button asChild size="sm" variant="outline" className="gap-1.5">
                        <Link href="/artisans?filter=inactifs">
                            <Users className="h-3.5 w-3.5" aria-hidden /> Relancer les artisans
                        </Link>
                    </Button>
                }
            />
        );
    }

    const pageIds = pagination.pageItems.map((r) => r.passport.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
    const someSelected = !allSelected && pageIds.some((id) => selectedIds.has(id));

    return (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
                <TableHeader stickyHeader>
                    <TableRow>
                        <TableHead>
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                                    onCheckedChange={(v) => onToggleAll(pageIds, v === true)}
                                    aria-label="Tout sélectionner"
                                />
                                <span>Référence</span>
                            </div>
                        </TableHead>
                        <TableHead>Reçu le</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pagination.pageItems.map((row) => (
                        <TableRow
                            key={row.passport.id}
                            className="cursor-pointer transition-colors"
                            onClick={() => onSelect(row.passport)}
                        >
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        checked={selectedIds.has(row.passport.id)}
                                        onCheckedChange={() => onToggleSelected(row.passport.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        aria-label={`Sélectionner ${row.passport.garment.reference}`}
                                    />
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-foreground">
                                            {row.passport.garment.reference}
                                        </p>
                                        <p className="truncate text-[10px] text-muted-foreground">
                                            {row.passport.garment.kind} · {row.passport.id}
                                        </p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className={cn('font-mono text-[11px]', ageTone(row.ageHours))}>
                                    {relativeDay(row.passport.createdAt)}
                                </span>
                            </TableCell>
                            <TableCell>
                                <IrisGradeBadge grade={row.grade} size="sm" />
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1.5">
                                    <Badge
                                        variant="outline"
                                        className={cn('font-mono text-[10px]', STATUS_TONE[row.status])}
                                    >
                                        {STATUS_LABEL[row.status === 'changes_requested' ? 'pending' : row.status]}
                                    </Badge>
                                    {row.status === 'changes_requested' ? (
                                        <Badge
                                            variant="outline"
                                            className={cn('font-mono text-[10px]', STATUS_TONE.changes_requested)}
                                        >
                                            Modifs demandées
                                        </Badge>
                                    ) : null}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelect(row.passport);
                                    }}
                                >
                                    Voir
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <PaginationBar
                page={pagination.page}
                pageCount={pagination.pageCount}
                pageSize={pagination.pageSize}
                rangeStart={pagination.rangeStart}
                rangeEnd={pagination.rangeEnd}
                totalCount={sorted.length}
                onPageChange={pagination.setPage}
                label="passeports"
            />
        </div>
    );
}
