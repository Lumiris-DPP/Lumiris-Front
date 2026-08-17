'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShieldAlert, Sparkles, Wrench } from 'lucide-react';
import { careSymbol } from '@lumiris/scoring-ui';
import type { WardrobeItemDto } from '@lumiris/api-client';

// Fenêtre au-delà de laquelle une garantie n'a pas encore besoin d'être rappelée : deux mois
// laissent le temps de signaler un défaut et de le faire traiter, sans transformer l'écran en
// compte à rebours permanent.
const WARRANTY_NOTICE_DAYS = 60;

// Trois pièces au maximum : au-delà, ce n'est plus un rappel, c'est une seconde liste au-dessus
// de l'inventaire — et plus personne ne lit ni l'une ni l'autre.
const MAX_ROWS = 3;

interface CareRow {
    key: string;
    label: string;
    careCodes: readonly string[];
    daysLeft: number | null;
}

function daysUntil(iso: string | null | undefined, now: number): number | null {
    if (!iso) return null;
    const time = new Date(iso).getTime();
    if (Number.isNaN(time)) return null;
    return Math.ceil((time - now) / 86_400_000);
}

// Ce qu'il y a à faire pour les pièces déjà reçues. Une garantie qui s'achève passe devant tout :
// c'est la seule ligne assortie d'une échéance qu'on ne peut pas rattraper.
function buildCareRows(items: readonly WardrobeItemDto[], now: number): CareRow[] {
    return items
        .map((item) => {
            const daysLeft = daysUntil(item.warrantyUntil, now);
            return {
                key: item.id,
                label: item.productName ?? 'Ta pièce',
                careCodes: (item.careInstructions ?? []).filter((code) => careSymbol(code) !== undefined),
                daysLeft: daysLeft !== null && daysLeft >= 0 && daysLeft <= WARRANTY_NOTICE_DAYS ? daysLeft : null,
            };
        })
        .filter((row) => row.daysLeft !== null || row.careCodes.length > 0)
        .sort((a, b) => (a.daysLeft ?? Number.POSITIVE_INFINITY) - (b.daysLeft ?? Number.POSITIVE_INFINITY))
        .slice(0, MAX_ROWS);
}

// La Garde-Robe ne disait plus rien une fois la pièce reçue — soit la période la plus longue de
// la relation. Ce panneau ne vend rien : il rappelle l'entretien tiré du passeport, prévient
// avant la fin d'une garantie, et ouvre sur le réseau de retoucheurs déjà présent dans l'app.
export function CarePanel({ items }: { items: readonly WardrobeItemDto[] }) {
    const rows = buildCareRows(items, Date.now());
    if (rows.length === 0) {
        return null;
    }

    return (
        <motion.section
            aria-label="Entretien et garanties"
            className="mb-5 rounded-2xl border border-border/60 bg-card p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
        >
            <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-lumiris-cyan" aria-hidden />
                <h2 className="text-sm font-bold text-foreground">Prendre soin de tes pièces</h2>
            </div>

            <ul className="mt-3 flex flex-col gap-3">
                {rows.map((row) => (
                    <li key={row.key} className="border-t border-border/40 pt-3 first:border-t-0 first:pt-0">
                        <p className="truncate text-xs font-semibold text-foreground">{row.label}</p>

                        {row.daysLeft !== null ? (
                            <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium text-lumiris-amber">
                                <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                {row.daysLeft === 0
                                    ? 'Garantie qui expire aujourd’hui'
                                    : `Garantie encore valable ${row.daysLeft} jour${row.daysLeft > 1 ? 's' : ''}`}
                            </p>
                        ) : null}

                        {row.careCodes.length > 0 ? <CareSymbols codes={row.careCodes} /> : null}
                    </li>
                ))}
            </ul>

            <Link
                href="/local"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-semibold text-foreground"
            >
                <Wrench className="h-3.5 w-3.5" aria-hidden />
                Trouver un retoucheur près de chez toi
            </Link>
        </motion.section>
    );
}

// Les pictogrammes GINETEX viennent du passeport, pas d'une interprétation : c'est exactement ce
// que l'atelier a déclaré, et c'est ce qui rend le rappel légitime.
function CareSymbols({ codes }: { codes: readonly string[] }) {
    return (
        <ul className="mt-1.5 flex flex-wrap items-center gap-2">
            {codes.map((code) => {
                const symbol = careSymbol(code);
                if (!symbol) return null;
                return (
                    <li key={code} className="inline-flex items-center gap-1">
                        <Image
                            src={symbol.svgPath}
                            alt=""
                            width={16}
                            height={16}
                            className="h-4 w-4 dark:invert"
                            aria-hidden
                            unoptimized
                        />
                        <span className="text-[10px] text-muted-foreground">{symbol.label}</span>
                    </li>
                );
            })}
        </ul>
    );
}
