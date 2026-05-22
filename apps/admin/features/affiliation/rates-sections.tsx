'use client';

import { useMemo } from 'react';
import { History, Pencil } from 'lucide-react';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@lumiris/ui/components/hover-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { cn } from '@lumiris/ui/lib/cn';
import {
    PURCHASE_RATE_BOUNDS,
    REPAIR_FLAT_BOUNDS,
    REPAIR_PCT_BOUNDS,
    type ProductCategory,
    type PurchaseRate,
    type RepairCommission,
} from '@/lib/affiliation-config';
import type { RateHistoryEntry } from './types';

type HistoryKey = string;
export const purchaseKey = (c: ProductCategory): HistoryKey => `purchase:${c}`;
export const repairKey = (mode: 'flat' | 'pct'): HistoryKey => `repair:${mode}`;

interface PurchaseSectionProps {
    rates: readonly PurchaseRate[];
    history: ReadonlyMap<HistoryKey, readonly RateHistoryEntry[]>;
    onEdit: (rate: PurchaseRate) => void;
}

export function PurchaseSection({ rates, history, onEdit }: PurchaseSectionProps) {
    return (
        <section className="border-border bg-card overflow-hidden rounded-xl border">
            <header className="border-border border-b px-4 py-3">
                <p className="text-foreground text-sm font-semibold">Affiliation à l&apos;achat</p>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                    Commission côté vendeur, jamais facturée à l&apos;utilisateur. Borne {PURCHASE_RATE_BOUNDS.min}-
                    {PURCHASE_RATE_BOUNDS.max} %.
                </p>
            </header>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Catégorie</TableHead>
                        <TableHead>Taux actuel</TableHead>
                        <TableHead>Dernière modif.</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rates.map((rate) => (
                        <TableRow key={rate.category}>
                            <TableCell>
                                <p className="text-foreground text-sm">{rate.label}</p>
                                <p className="text-muted-foreground text-[10px]">{rate.category}</p>
                            </TableCell>
                            <TableCell>
                                <span className="text-foreground font-mono text-sm">{rate.percent} %</span>
                            </TableCell>
                            <TableCell>
                                <HistoryHover entries={history.get(purchaseKey(rate.category)) ?? []} />
                            </TableCell>
                            <TableCell className="text-right">
                                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onEdit(rate)}>
                                    <Pencil className="h-3 w-3" /> Modifier
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </section>
    );
}

interface RepairSectionProps {
    repair: RepairCommission;
    history: ReadonlyMap<HistoryKey, readonly RateHistoryEntry[]>;
    onToggleMode: (mode: 'flat' | 'pct') => void;
    onEditFlat: () => void;
    onEditPct: () => void;
}

export function RepairSection({ repair, history, onToggleMode, onEditFlat, onEditPct }: RepairSectionProps) {
    const rows = useMemo(
        () => [
            { mode: 'flat' as const, label: 'Forfait par retouche', value: `${repair.flatEur} €`, onEdit: onEditFlat },
            { mode: 'pct' as const, label: '% du devis', value: `${repair.pct} %`, onEdit: onEditPct },
        ],
        [repair, onEditFlat, onEditPct],
    );
    return (
        <section className="border-border bg-card overflow-hidden rounded-xl border">
            <header className="border-border border-b px-4 py-3">
                <p className="text-foreground text-sm font-semibold">Commissions retouche / réparation</p>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                    Payée par le pro. Forfait {REPAIR_FLAT_BOUNDS.min}-{REPAIR_FLAT_BOUNDS.max} € ou{' '}
                    {REPAIR_PCT_BOUNDS.min}-{REPAIR_PCT_BOUNDS.max} % du devis.
                </p>
            </header>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Forfait ou %</TableHead>
                        <TableHead>Dernière modif.</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row) => {
                        const active = repair.mode === row.mode;
                        return (
                            <TableRow key={row.mode}>
                                <TableCell>
                                    <p className="text-foreground inline-flex items-center gap-2 text-sm">
                                        {row.label}
                                        {active ? (
                                            <Badge
                                                variant="outline"
                                                className="border-lumiris-emerald/40 text-lumiris-emerald font-mono text-[10px]"
                                            >
                                                actif
                                            </Badge>
                                        ) : null}
                                    </p>
                                </TableCell>
                                <TableCell
                                    className={cn(
                                        'font-mono text-sm',
                                        active ? 'text-foreground' : 'text-muted-foreground',
                                    )}
                                >
                                    {row.value}
                                </TableCell>
                                <TableCell>
                                    <HistoryHover entries={history.get(repairKey(row.mode)) ?? []} />
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="inline-flex items-center justify-end gap-1.5">
                                        {!active ? (
                                            <Button size="sm" variant="ghost" onClick={() => onToggleMode(row.mode)}>
                                                Activer
                                            </Button>
                                        ) : null}
                                        <Button size="sm" variant="outline" className="gap-1.5" onClick={row.onEdit}>
                                            <Pencil className="h-3 w-3" /> Modifier
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </section>
    );
}

function HistoryHover({ entries }: { entries: readonly RateHistoryEntry[] }) {
    const latest = entries[0];
    if (!latest) {
        return <span className="text-muted-foreground text-[11px] italic">Aucune modification</span>;
    }
    return (
        <HoverCard openDelay={150} closeDelay={80}>
            <HoverCardTrigger asChild>
                <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-[11px] underline-offset-2 hover:underline"
                >
                    <History className="h-3 w-3" aria-hidden />
                    {new Date(latest.at).toLocaleDateString('fr-FR')}
                </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-72 text-xs" align="start">
                <p className="text-foreground mb-2 text-[11px] font-semibold">3 derniers changements</p>
                <ol className="space-y-2">
                    {entries.map((entry) => (
                        <li key={entry.id} className="border-border border-l-2 pl-2">
                            <p className="text-foreground font-mono text-[11px]">
                                {entry.oldValue} → <strong>{entry.newValue}</strong>
                            </p>
                            <p className="text-muted-foreground text-[10px]">
                                {new Date(entry.at).toLocaleString('fr-FR')}
                            </p>
                            <p className="text-muted-foreground mt-0.5 text-[10px] italic">{entry.reason}</p>
                        </li>
                    ))}
                </ol>
            </HoverCardContent>
        </HoverCard>
    );
}
