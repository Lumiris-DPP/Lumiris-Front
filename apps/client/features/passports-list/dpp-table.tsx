'use client';

import type { KeyboardEvent } from 'react';
import { ChevronRight, Loader2, SearchX } from 'lucide-react';
import type { DppFormSummaryDto } from '@lumiris/api-client';
import { garmentCategoryLabel } from '@lumiris/scoring-ui';
import { formatDateFr } from '@lumiris/utils';
import { Button } from '@lumiris/ui/components/button';
import { Card } from '@lumiris/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { cn } from '@lumiris/ui/lib/cn';
import { DppStatusBadge, DppTile } from './dpp-visuals';
import { DppRowActions, useDppActions } from './dpp-row-actions';

interface DppTableProps {
    rows: DppFormSummaryDto[];
    total: number;
    onResetFilters?: () => void;
}

const HEAD_CLASS = 'h-11 text-[11px] font-medium tracking-wider text-muted-foreground uppercase';

export function DppTable({ rows, total, onResetFilters }: DppTableProps) {
    const actions = useDppActions();

    // Ligne cliquable : on double le clic souris d'un support clavier (Entrée / Espace).
    const rowKeyDown = (event: KeyboardEvent, dpp: DppFormSummaryDto) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        actions.open(dpp);
    };

    if (rows.length === 0) {
        return (
            <Card className="items-center gap-3 px-6 py-14 text-center">
                <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <SearchX className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Aucun passeport ne correspond</p>
                    <p className="text-sm text-muted-foreground">
                        Ajustez votre recherche ou le filtre de statut pour retrouver vos pièces.
                    </p>
                </div>
                {onResetFilters && (
                    <Button variant="outline" size="sm" onClick={onResetFilters}>
                        Réinitialiser les filtres
                    </Button>
                )}
            </Card>
        );
    }

    return (
        <Card className="gap-0 overflow-hidden py-0">
            {/* Desktop : tableau complet. */}
            <div className="hidden md:block">
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className={cn(HEAD_CLASS, 'pl-5')}>Produit</TableHead>
                            <TableHead className={HEAD_CLASS}>Catégorie</TableHead>
                            <TableHead className={HEAD_CLASS}>Créé le</TableHead>
                            <TableHead className={HEAD_CLASS}>Statut</TableHead>
                            <TableHead className={cn(HEAD_CLASS, 'w-16 pr-5 text-right')}>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((dpp) => (
                            <TableRow
                                key={dpp.id}
                                role="link"
                                tabIndex={0}
                                aria-label={`Ouvrir le passeport ${dpp.productName ?? 'sans nom'}`}
                                onClick={() => actions.open(dpp)}
                                onKeyDown={(e) => rowKeyDown(e, dpp)}
                                className="group cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
                            >
                                <TableCell className="py-3 pl-5">
                                    <div className="flex items-center gap-3">
                                        <DppTile productName={dpp.productName} status={dpp.status} />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate font-medium text-foreground">
                                                    {dpp.productName ?? 'Sans nom'}
                                                </p>
                                                {actions.loadingId === dpp.id && (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                                )}
                                            </div>
                                            <p className="truncate font-mono text-xs text-muted-foreground">
                                                {dpp.sku ?? 'SKU non renseigné'}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="py-3">
                                    <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                                        {garmentCategoryLabel(dpp.productCategory)}
                                    </span>
                                </TableCell>
                                <TableCell className="py-3 text-sm text-muted-foreground tabular-nums">
                                    {formatDateFr(dpp.createdAt)}
                                </TableCell>
                                <TableCell className="py-3">
                                    <DppStatusBadge status={dpp.status} />
                                </TableCell>
                                <TableCell className="py-3 pr-5" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-0.5">
                                        <ChevronRight
                                            className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                                            aria-hidden
                                        />
                                        <DppRowActions dpp={dpp} actions={actions} className="h-8 w-8" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile : le tableau déborderait, on retombe sur une liste de cartes. */}
            <ul className="divide-y divide-border md:hidden">
                {rows.map((dpp) => (
                    <li key={dpp.id} className="flex items-center gap-3 px-4 py-3">
                        <div
                            role="link"
                            tabIndex={0}
                            aria-label={`Ouvrir le passeport ${dpp.productName ?? 'sans nom'}`}
                            onClick={() => actions.open(dpp)}
                            onKeyDown={(e) => rowKeyDown(e, dpp)}
                            className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                            <DppTile productName={dpp.productName} status={dpp.status} />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="truncate font-medium text-foreground">
                                        {dpp.productName ?? 'Sans nom'}
                                    </p>
                                    {actions.loadingId === dpp.id && (
                                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
                                    )}
                                </div>
                                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <DppStatusBadge status={dpp.status} />
                                    <span className="text-xs text-muted-foreground">
                                        {garmentCategoryLabel(dpp.productCategory)}
                                    </span>
                                    <span className="text-xs text-muted-foreground" aria-hidden>
                                        ·
                                    </span>
                                    <span className="text-xs text-muted-foreground tabular-nums">
                                        {formatDateFr(dpp.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <DppRowActions dpp={dpp} actions={actions} className="h-8 w-8 shrink-0" />
                    </li>
                ))}
            </ul>

            <div className="border-t border-border bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground md:px-5">
                {rows.length} passeport{rows.length !== 1 ? 's' : ''} affiché{rows.length !== 1 ? 's' : ''}
                {total !== rows.length && ` sur ${total}`}
            </div>
        </Card>
    );
}
