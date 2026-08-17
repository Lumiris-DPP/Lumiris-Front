'use client';

import { useMemo } from 'react';
import { cn } from '@lumiris/ui/lib/cn';
import { isAwaitingCuration } from '@/lib/curation-status';
import { FIXTURE_NOW_MS } from '@/lib/fixture-clock';
import type { PassportRow } from './types';

const SLA_AMBER_HOURS = 48;
const DAY_MS = 86_400_000;

interface KpiChip {
    label: string;
    value: string;
    tone: string;
}

export function Kpis({ rows }: { rows: readonly PassportRow[] }) {
    const chips = useMemo<readonly KpiChip[]>(() => {
        const pendingRows = rows.filter((r) => isAwaitingCuration(r.status));
        const overSla = pendingRows.filter((r) => r.ageHours >= SLA_AMBER_HOURS).length;
        // La date de référence est celle de la DÉCISION, pas celle de la dernière modification du
        // passeport : sans ça une validation prise à l'instant n'apparaît jamais dans le compteur.
        // Fenêtre mesurée contre l'horloge des fixtures, comme l'âge de la file juste à côté.
        const validatedLast7d = rows.filter(
            (r) =>
                r.status === 'validated' &&
                r.decidedAt !== null &&
                FIXTURE_NOW_MS - new Date(r.decidedAt).getTime() < 7 * DAY_MS,
        ).length;
        const flagged = rows.filter((r) => r.status === 'flagged').length;
        return [
            { label: 'En attente', value: pendingRows.length.toString(), tone: 'text-lumiris-cyan' },
            {
                // Le nombre est celui des passeports HORS délai : intitulé « SLA 48 h », il se lisait
                // comme un objectif atteint à côté de lignes reçues il y a 220 jours.
                label: 'Hors SLA (48 h)',
                value: overSla.toString(),
                tone: overSla > 0 ? 'text-lumiris-rose' : 'text-lumiris-emerald',
            },
            { label: 'Validés 7 j', value: validatedLast7d.toString(), tone: 'text-lumiris-emerald' },
            { label: 'Rejets', value: flagged.toString(), tone: 'text-lumiris-rose' },
        ];
    }, [rows]);

    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {chips.map((chip, i) => (
                <span key={chip.label} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    {i > 0 ? (
                        <span aria-hidden className="text-muted-foreground/40">
                            ·
                        </span>
                    ) : null}
                    <span>{chip.label}</span>
                    <span className={cn('font-mono font-semibold', chip.tone)}>{chip.value}</span>
                </span>
            ))}
        </div>
    );
}
