'use client';

import { ArrowUpCircle, Filter } from 'lucide-react';
import type { Artisan } from '@lumiris/types';
import { Avatar, AvatarFallback, AvatarImage } from '@lumiris/ui/components/avatar';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Progress } from '@lumiris/ui/components/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { cn } from '@lumiris/ui/lib/cn';
import type { ArtisanRow } from '@/lib/artisan-analytics';
import { healthBand } from '@/lib/health-score';
import { EmptyState } from '../_shared/empty-state';
import { PaginationBar } from '../_shared/pagination-bar';
import { usePagination } from '../_shared/use-pagination';
import { LABEL_BADGES, TIER_TONE } from './tier-status';

interface ArtisanTableProps {
    rows: readonly ArtisanRow[];
    onSelect: (a: Artisan) => void;
    onResetFilters: () => void;
}

export function ArtisanTable({ rows, onSelect, onResetFilters }: ArtisanTableProps) {
    const pagination = usePagination(rows, 25);

    if (rows.length === 0) {
        return (
            <EmptyState
                title="Aucun artisan ne correspond"
                description="Réinitialisez les filtres."
                action={
                    <Button size="sm" variant="outline" onClick={onResetFilters} className="gap-1.5">
                        <Filter className="h-3.5 w-3.5" aria-hidden /> Réinitialiser
                    </Button>
                }
            />
        );
    }
    return (
        <div className="border-border bg-card overflow-hidden rounded-xl border">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader stickyHeader>
                        <TableRow>
                            <TableHead>Atelier</TableHead>
                            <TableHead>Profil</TableHead>
                            <TableHead>Passeports</TableHead>
                            <TableHead>Iris</TableHead>
                            <TableHead>Santé</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pagination.pageItems.map((row) => (
                            <Row key={row.artisan.id} row={row} onSelect={onSelect} />
                        ))}
                    </TableBody>
                </Table>
            </div>
            <PaginationBar
                page={pagination.page}
                pageCount={pagination.pageCount}
                pageSize={pagination.pageSize}
                rangeStart={pagination.rangeStart}
                rangeEnd={pagination.rangeEnd}
                totalCount={rows.length}
                onPageChange={pagination.setPage}
                label="artisans"
            />
        </div>
    );
}

function Row({ row, onSelect }: { row: ArtisanRow; onSelect: (a: Artisan) => void }) {
    const ratio =
        row.artisan.passportLimit === Number.POSITIVE_INFINITY
            ? 0
            : Math.min(100, (row.publishedCount / row.artisan.passportLimit) * 100);
    const band = healthBand(row.health.total);
    const bandClass =
        band === 'critical'
            ? 'border-lumiris-rose/40 bg-lumiris-rose/10 text-lumiris-rose'
            : band === 'warning'
              ? 'border-lumiris-amber/40 bg-lumiris-amber/10 text-lumiris-amber'
              : 'border-lumiris-emerald/40 bg-lumiris-emerald/10 text-lumiris-emerald';

    return (
        <TableRow className="cursor-pointer" onClick={() => onSelect(row.artisan)}>
            <TableCell>
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={row.artisan.photoUrl} alt="" />
                        <AvatarFallback className="text-[10px]">
                            {row.artisan.displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="text-foreground truncate text-sm">{row.artisan.atelierName}</p>
                        <p className="text-muted-foreground truncate text-[11px]">
                            {row.artisan.displayName} · {row.artisan.city}
                        </p>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex flex-wrap items-center gap-1">
                    <Badge variant="outline" className={cn('font-mono text-[10px]', TIER_TONE[row.artisan.tier])}>
                        {row.artisan.tier}
                    </Badge>
                    {row.artisan.plus ? (
                        <Badge
                            variant="outline"
                            className="border-lumiris-cyan/40 text-lumiris-cyan font-mono text-[10px]"
                        >
                            ATELIER+
                        </Badge>
                    ) : null}
                    {row.artisan.epvLabeled ? (
                        <Badge variant="outline" className={cn('font-mono text-[10px]', LABEL_BADGES.epv.tone)}>
                            {LABEL_BADGES.epv.label}
                        </Badge>
                    ) : null}
                    {row.artisan.ofgLabeled ? (
                        <Badge variant="outline" className={cn('font-mono text-[10px]', LABEL_BADGES.ofg.tone)}>
                            {LABEL_BADGES.ofg.label}
                        </Badge>
                    ) : null}
                </div>
            </TableCell>
            <TableCell>
                <div className="flex flex-col gap-1">
                    <span className="font-mono text-xs">
                        {row.publishedCount}
                        <span className="text-muted-foreground">
                            {' '}
                            / {row.artisan.passportLimit === Number.POSITIVE_INFINITY ? '∞' : row.artisan.passportLimit}
                        </span>
                    </span>
                    {ratio > 0 ? <Progress value={ratio} className="h-1" /> : null}
                    {row.upgradeHint ? (
                        <Badge
                            variant="outline"
                            className="border-lumiris-cyan/40 text-lumiris-cyan mt-0.5 gap-1 font-mono text-[10px]"
                        >
                            <ArrowUpCircle className="h-3 w-3" /> Upgrade {row.upgradeHint}
                        </Badge>
                    ) : null}
                </div>
            </TableCell>
            <TableCell>
                <span className="font-mono text-xs">
                    {row.avgScore === 0 ? '—' : row.avgScore.toFixed(1)}
                    {row.avgGrade !== '-' ? <span className="text-muted-foreground"> · {row.avgGrade}</span> : null}
                </span>
            </TableCell>
            <TableCell>
                <Badge
                    variant="outline"
                    className={cn('font-mono text-[11px]', bandClass)}
                    aria-label={`Santé ${row.health.total} sur 100`}
                >
                    {row.health.total}
                </Badge>
            </TableCell>
            <TableCell className="text-right">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(row.artisan);
                    }}
                >
                    Détail
                </Button>
            </TableCell>
        </TableRow>
    );
}
