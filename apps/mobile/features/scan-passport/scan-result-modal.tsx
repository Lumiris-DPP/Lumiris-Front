'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Store } from 'lucide-react';
import { GRADE_LABEL, IrisGrade } from '@lumiris/scoring-ui';
import type { Artisan, Passport, ScoreResult } from '@lumiris/types';
import { Sheet, SheetContent, SheetTitle } from '@lumiris/ui/components/sheet';
import { getMarketplaceItems } from '@/lib/marketplace';
import { BoutiqueCard } from '@/features/boutique/card';

interface ScanResultModalProps {
    passport: Passport;
    artisan?: Artisan;
    score: ScoreResult;
    onClose: () => void;
    onOpen: () => void;
}

export function ScanResultModal({ passport, artisan, score, onClose, onOpen }: ScanResultModalProps) {
    const subLabel = `${artisan?.atelierName ?? '—'}${artisan?.city ? ` · ${artisan.city}` : ''}`;
    const isE = score.grade === 'E';

    const [now] = useState(() => new Date());
    const alternatives = useMemo(() => {
        if (!isE) return [];
        return getMarketplaceItems(now)
            .filter((item) => item.passport.id !== passport.id)
            .slice(0, 3);
    }, [isE, now, passport.id]);

    return (
        <Sheet defaultOpen onOpenChange={(open) => (open ? null : onClose())}>
            <SheetContent
                side="bottom"
                className="mx-auto max-h-[82vh] max-w-md overflow-y-auto rounded-t-3xl px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-8"
            >
                <SheetTitle className="sr-only">Passeport détecté</SheetTitle>
                <div className="flex flex-col items-center gap-5">
                    <IrisGrade grade={score.grade} size="xl" tone="solid" shape="pill" />
                    <div className="flex flex-col items-center gap-1 text-center">
                        <p className="text-foreground text-base font-semibold">{passport.garment.reference}</p>
                        <p className="text-muted-foreground text-sm">{subLabel}</p>
                        <p className="text-muted-foreground/80 text-sm">{GRADE_LABEL[score.grade]}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onOpen}
                        className="bg-foreground text-background hover:bg-foreground/90 inline-flex h-14 w-full items-center justify-center rounded-2xl text-sm font-semibold"
                    >
                        Ouvrir le passeport
                    </button>
                </div>

                {isE && alternatives.length > 0 ? (
                    <section className="border-border/60 mt-6 border-t pt-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Store className="text-primary h-4 w-4" strokeWidth={1.5} aria-hidden />
                                <h3 className="text-foreground text-sm font-semibold">Alternatives artisanes</h3>
                            </div>
                            <Link
                                href="/boutique"
                                className="text-primary inline-flex items-center gap-1 text-xs font-semibold"
                            >
                                Voir la boutique
                                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                            </Link>
                        </div>
                        <p className="text-muted-foreground mb-3 text-pretty text-xs leading-relaxed">
                            Cette pièce est peu transparente. Voici des alternatives au passeport vérifié.
                        </p>
                        <ul className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
                            {alternatives.map((item, index) => (
                                <li key={item.passport.id} className="w-40 shrink-0 snap-start">
                                    <BoutiqueCard item={item} index={index} />
                                </li>
                            ))}
                        </ul>
                    </section>
                ) : null}
            </SheetContent>
        </Sheet>
    );
}
