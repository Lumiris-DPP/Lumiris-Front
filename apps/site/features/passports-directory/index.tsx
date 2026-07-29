'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Filter, MapPin, X } from 'lucide-react';
import type { GarmentKind, IrisGrade } from '@lumiris/types';
import type { PassportPublicView } from '@lumiris/mock-data';
import { IrisGrade as IrisGradeBadge } from '@lumiris/scoring-ui/components/iris-grade';
import { KIND_LABEL_FR } from '@lumiris/utils';

const GRADES: readonly IrisGrade[] = ['A', 'B', 'C', 'D', 'E'];
const KINDS: readonly GarmentKind[] = ['sweater', 'shirt', 'shoe', 'jacket', 'trouser', 'accessory'];

interface Props {
    passports: readonly PassportPublicView[];
}

export function PassportsDirectory({ passports }: Props) {
    const [grades, setGrades] = useState<readonly IrisGrade[]>([]);
    const [kinds, setKinds] = useState<readonly GarmentKind[]>([]);

    const filtered = useMemo(
        () =>
            passports.filter((view) => {
                if (!view.irisScore) return false;
                if (grades.length > 0 && !grades.includes(view.irisScore.grade)) return false;
                if (kinds.length > 0 && !kinds.includes(view.passport.garment.kind)) return false;
                return true;
            }),
        [passports, grades, kinds],
    );

    const toggleGrade = (g: IrisGrade) =>
        setGrades((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
    const toggleKind = (k: GarmentKind) =>
        setKinds((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

    const reset = () => {
        setGrades([]);
        setKinds([]);
    };

    const hasFilters = grades.length > 0 || kinds.length > 0;

    return (
        <div className="pt-28 pb-20">
            <header className="mx-auto mb-12 max-w-5xl px-6">
                <p className="mb-4 text-xs font-medium tracking-[0.25em] text-muted-foreground uppercase">
                    Passeports DPP
                </p>
                <h1 className="text-4xl font-bold tracking-tight text-balance text-foreground sm:text-5xl">
                    Les pièces vivantes publiées
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground">
                    Chaque passeport raconte une pièce : composition, étapes de fabrication, atelier, score Iris V2.
                    Filtrez par grade ou par catégorie.
                </p>
            </header>

            <section
                aria-label="Filtres des passeports"
                className="mx-auto mb-10 max-w-5xl rounded-2xl border border-border bg-card p-5"
            >
                <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <Filter className="h-3.5 w-3.5" />
                        Filtres
                    </span>

                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                            Grade
                        </span>
                        {GRADES.map((g) => {
                            const active = grades.includes(g);
                            return (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => toggleGrade(g)}
                                    aria-pressed={active}
                                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-bold transition-colors ${
                                        active
                                            ? 'bg-foreground text-background'
                                            : 'border border-border text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {g}
                                </button>
                            );
                        })}
                    </div>

                    {hasFilters ? (
                        <button
                            type="button"
                            onClick={reset}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                        >
                            <X className="h-3 w-3" />
                            Réinitialiser
                        </button>
                    ) : null}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                    {KINDS.map((k) => {
                        const active = kinds.includes(k);
                        return (
                            <button
                                key={k}
                                type="button"
                                onClick={() => toggleKind(k)}
                                aria-pressed={active}
                                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                                    active
                                        ? 'border-foreground bg-foreground text-background'
                                        : 'border-border text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {KIND_LABEL_FR[k]}
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="mx-auto max-w-5xl px-6">
                {filtered.length === 0 ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">
                        Aucun passeport ne correspond à ces filtres.{' '}
                        <button
                            type="button"
                            onClick={reset}
                            className="text-foreground underline-offset-4 hover:underline"
                        >
                            Réinitialiser
                        </button>
                        .
                    </p>
                ) : (
                    <>
                        <p className="mb-6 text-xs font-medium tracking-[0.25em] text-muted-foreground uppercase">
                            {filtered.length} passeport{filtered.length > 1 ? 's' : ''}
                        </p>
                        <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
                            {filtered.map((view, i) => {
                                const score = view.irisScore;
                                if (!score) return null;
                                const kind = KIND_LABEL_FR[view.passport.garment.kind] ?? KIND_LABEL_FR.other;
                                const photo = view.passport.garment.mainPhotoUrl;
                                return (
                                    <motion.li
                                        key={view.passport.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: '-30px' }}
                                        transition={{ duration: 0.4, delay: i * 0.03 }}
                                    >
                                        <Link
                                            href={`/passeport/${view.passport.id}`}
                                            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:border-lumiris-cyan/40 hover:shadow-md"
                                        >
                                            <div className="relative aspect-4/5 w-full overflow-hidden bg-muted">
                                                {photo ? (
                                                    <Image
                                                        src={photo}
                                                        alt={`${kind} ${view.passport.garment.reference} - ${view.artisan.atelierName}`}
                                                        fill
                                                        sizes="(min-width: 768px) 240px, (min-width: 640px) 280px, 50vw"
                                                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                                    />
                                                ) : null}
                                                <div className="absolute top-2 right-2">
                                                    <IrisGradeBadge
                                                        grade={score.grade}
                                                        size="sm"
                                                        tone="solid"
                                                        shape="square"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 p-4">
                                                <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                                                    {kind}
                                                </p>
                                                <h3 className="line-clamp-1 text-sm leading-snug font-semibold text-foreground">
                                                    {view.passport.garment.reference}
                                                </h3>
                                                <p className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                                    <MapPin className="h-3 w-3" />
                                                    <span className="truncate">{view.artisan.atelierName}</span>
                                                </p>
                                            </div>
                                        </Link>
                                    </motion.li>
                                );
                            })}
                        </ul>
                    </>
                )}
            </section>
        </div>
    );
}
