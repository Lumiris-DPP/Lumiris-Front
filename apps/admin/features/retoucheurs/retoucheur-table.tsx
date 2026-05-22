'use client';

import { Inbox, MapPin, Megaphone, ShieldCheck, Star } from 'lucide-react';
import type { Repairer } from '@lumiris/types';
import { Avatar, AvatarFallback } from '@lumiris/ui/components/avatar';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { cn } from '@lumiris/ui/lib/cn';
import { EmptyState } from '../_shared/empty-state';
import { PaginationBar } from '../_shared/pagination-bar';
import { usePagination } from '../_shared/use-pagination';
import { SPECIALITY_LABEL } from './specialty-status';
import type { CandidatureStatus, RetoucheurOverlay } from './types';

const SPECIALTY_VISIBLE_MAX = 3;

const KYC_ROW_TONE: Record<CandidatureStatus, string> = {
    verified: '',
    pending: 'bg-lumiris-amber/5',
    rejected: 'bg-lumiris-rose/5',
};

interface RetoucheurTableProps {
    rows: readonly Repairer[];
    overlays: Map<string, RetoucheurOverlay>;
    onSelect: (r: Repairer) => void;
    cityFilter: string;
    onResetFilters: () => void;
}

export function RetoucheurTable({ rows, overlays, onSelect, cityFilter, onResetFilters }: RetoucheurTableProps) {
    const pagination = usePagination(rows, 25);

    if (rows.length === 0) {
        const cityScoped = cityFilter !== 'all';
        return (
            <EmptyState
                icon={cityScoped ? Megaphone : Inbox}
                title={cityScoped ? 'Aucun retoucheur sur cette zone' : 'Aucun retoucheur ne correspond aux filtres'}
                description={cityScoped ? 'Personne n’est encore référencé ici.' : 'Élargissez le périmètre.'}
                action={
                    <Button size="sm" variant="outline" onClick={onResetFilters} className="gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Réinitialiser
                    </Button>
                }
            />
        );
    }
    return (
        <div className="border-border bg-card overflow-hidden rounded-xl border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Retoucheur</TableHead>
                        <TableHead>Spécialités</TableHead>
                        <TableHead>Offre</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pagination.pageItems.map((r) => {
                        const status = overlays.get(r.id)?.candidatureStatus ?? 'verified';
                        const visibleSpecs = r.specialities.slice(0, SPECIALTY_VISIBLE_MAX);
                        const overflowSpecs = r.specialities.length - visibleSpecs.length;
                        return (
                            <TableRow
                                key={r.id}
                                className={cn('cursor-pointer', KYC_ROW_TONE[status])}
                                onClick={() => onSelect(r)}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="text-[10px]">
                                                {r.displayName.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-foreground text-sm">{r.displayName}</p>
                                            <p className="text-muted-foreground inline-flex items-center gap-1 text-[10px]">
                                                <MapPin className="h-2.5 w-2.5" aria-hidden />
                                                {r.atelierName ?? ''} · {r.city}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {visibleSpecs.map((s) => (
                                            <Badge key={s} variant="outline" className="text-[10px]">
                                                {SPECIALITY_LABEL[s]}
                                            </Badge>
                                        ))}
                                        {overflowSpecs > 0 ? (
                                            <Badge variant="outline" className="text-muted-foreground text-[10px]">
                                                +{overflowSpecs}
                                            </Badge>
                                        ) : null}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p className="text-foreground font-mono text-sm">{r.avgDelayDays} j</p>
                                    <p className="text-muted-foreground font-mono text-[10px]">
                                        {r.priceRange.min}–{r.priceRange.max} €
                                    </p>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 font-mono text-xs">
                                        <Star className="text-lumiris-amber h-3 w-3 fill-current" aria-hidden />
                                        {r.avgRating.toFixed(1)}
                                        <span className="text-muted-foreground">({r.reviewCount})</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelect(r);
                                        }}
                                        aria-label={`Ouvrir la fiche de ${r.displayName}`}
                                    >
                                        Détail
                                    </Button>
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
                label="retoucheurs"
            />
        </div>
    );
}
