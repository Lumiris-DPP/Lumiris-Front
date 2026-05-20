'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Tag, TrendingUp, TrendingDown, Minus, ShieldCheck, ChevronRight } from 'lucide-react';
import { CertificatesList, useUniqueCertificates } from '@lumiris/scoring-ui';
import { mockArtisanById, mockPassports } from '@lumiris/mock-data';
import type { Passport } from '@lumiris/types';
import { KIND_LABEL_FR } from '@lumiris/utils';
import { cn } from '@lumiris/ui/lib/cn';
import { findAlternatives } from '@/lib/iris/alternatives';
import { usePassportScore } from '@/lib/iris/use-passport-score';
import { useWardrobe } from '@/lib/wardrobe-storage';
import { ShopCard } from '@/features/shop/card';
import type { ShopItem } from '@/lib/shop';
import { ScoreHero } from './score-hero';
import { CompositionRow } from './composition-row';
import { ImpactStats } from './impact-stats';
import { JourneyTimeline } from './journey-timeline';
import { ActionBar } from './action-bar';
import { ScoreSheet } from './score-sheet';

const LAYER_DELAYS = {
    identity: 0.25,
    composition: 0.35,
    impact: 0.5,
    journey: 0.65,
    proofs: 0.8,
    alternatives: 0.85,
} as const;

export interface PassportDetailProps {
    passport: Passport;
}

export function PassportDetail({ passport }: PassportDetailProps) {
    const [now] = useState(() => new Date());
    const score = usePassportScore(passport, now);
    const artisan = mockArtisanById(passport.artisanId);
    const [breakdownOpen, setBreakdownOpen] = useState(false);

    const wardrobe = useWardrobe();
    const wardrobeEntry = wardrobe.find((item) => item.kind === 'lumiris-passport' && item.passportId === passport.id);
    const isSaved = wardrobeEntry !== undefined;
    const documents =
        wardrobeEntry !== undefined && wardrobeEntry.kind === 'lumiris-passport' ? wardrobeEntry.documents : [];

    const brand = artisan?.atelierName ?? artisan?.displayName ?? 'Atelier indépendant';
    const productName = passport.garment.reference;

    const priceMedian = useMemo(() => {
        const peers = mockPassports
            .filter((p) => p.garment.kind === passport.garment.kind && p.id !== passport.id)
            .map((p) => p.garment.retailPrice)
            .sort((a, b) => a - b);
        if (peers.length === 0) return passport.garment.retailPrice;
        const mid = Math.floor(peers.length / 2);
        return peers.length % 2 === 0
            ? ((peers[mid - 1] ?? 0) + (peers[mid] ?? 0)) / 2
            : (peers[mid] ?? passport.garment.retailPrice);
    }, [passport.garment.kind, passport.garment.retailPrice, passport.id]);

    const ratio = useMemo(() => {
        const goodGrade = score.grade === 'A' || score.grade === 'B';
        const badGrade = score.grade === 'D' || score.grade === 'E';
        if (goodGrade && passport.garment.retailPrice < priceMedian) {
            return { kind: 'great-deal' as const, label: 'Great Deal' };
        }
        if (badGrade && passport.garment.retailPrice > priceMedian) {
            return { kind: 'overpriced' as const, label: 'Overpriced' };
        }
        return { kind: 'fair' as const, label: 'Fair Price' };
    }, [score.grade, passport.garment.retailPrice, priceMedian]);

    const certificates = useUniqueCertificates(passport);

    const isOpaque = score.grade === 'E';

    const alternativeItems = useMemo<readonly ShopItem[]>(() => {
        if (score.grade !== 'E') return [];
        return findAlternatives(passport, now, 4).map((row) => ({
            passport: row.passport,
            score: row.score,
            artisanName: mockArtisanById(row.passport.artisanId)?.atelierName ?? '-',
            isFeatured: false,
        }));
    }, [score.grade, passport, now]);

    const scannedDateLabel = new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(now);

    return (
        <div className="bg-background relative flex h-full w-full flex-col overflow-y-auto pb-28">
            <ScoreHero
                grade={score.grade}
                productName={productName}
                brand={brand}
                onOpenBreakdown={() => setBreakdownOpen(true)}
            />

            <div className="flex flex-col gap-5 px-4">
                {/* Filter saturate uniquement sur identity → proofs ; les alternatives doivent rester saturées. */}
                <div
                    className="flex flex-col gap-5"
                    style={isOpaque ? { filter: 'saturate(0.3) brightness(0.95)' } : undefined}
                >
                    <Layer delay={LAYER_DELAYS.identity}>
                        <SectionHeading>Identité</SectionHeading>
                        {artisan ? (
                            <Link
                                href={`/artisans/${artisan.slug}`}
                                prefetch
                                className="border-border bg-card hover:bg-muted/40 active:bg-muted/60 flex items-start gap-3 rounded-xl border p-4 transition-colors"
                            >
                                <span className="bg-muted text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                                    <Tag className="h-4 w-4" aria-hidden />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-foreground text-sm font-semibold">{brand}</p>
                                    <p className="text-muted-foreground text-xs">
                                        {KIND_LABEL_FR[passport.garment.kind]} · réf. {passport.garment.reference}
                                    </p>
                                </div>
                                <p className="text-foreground shrink-0 font-mono text-base font-semibold">
                                    {formatPrice(passport.garment.retailPrice)}
                                </p>
                                <ChevronRight className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                            </Link>
                        ) : (
                            <div className="border-border bg-card flex items-start gap-3 rounded-xl border p-4">
                                <span className="bg-muted text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                                    <Tag className="h-4 w-4" aria-hidden />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-foreground text-sm font-semibold">{brand}</p>
                                    <p className="text-muted-foreground text-xs">
                                        {KIND_LABEL_FR[passport.garment.kind]} · réf. {passport.garment.reference}
                                    </p>
                                </div>
                                <p className="text-foreground shrink-0 font-mono text-base font-semibold">
                                    {formatPrice(passport.garment.retailPrice)}
                                </p>
                            </div>
                        )}

                        <PriceRatioCard ratio={ratio} />
                    </Layer>

                    {passport.materials.length > 0 ? (
                        <Layer delay={LAYER_DELAYS.composition}>
                            <SectionHeading>Composition</SectionHeading>
                            <div className="space-y-2.5">
                                {passport.materials.map((material, idx) => (
                                    <CompositionRow key={`${idx}-${material.fiber}`} material={material} />
                                ))}
                            </div>
                        </Layer>
                    ) : null}

                    <Layer delay={LAYER_DELAYS.impact}>
                        <SectionHeading>Impact</SectionHeading>
                        <ImpactStats passport={passport} />
                    </Layer>

                    {passport.steps.length > 0 ? (
                        <Layer delay={LAYER_DELAYS.journey}>
                            <SectionHeading>Le parcours</SectionHeading>
                            <JourneyTimeline steps={passport.steps} grade={score.grade} />
                        </Layer>
                    ) : null}

                    {certificates.length > 0 ? (
                        <Layer delay={LAYER_DELAYS.proofs}>
                            <SectionHeading>Preuves vérifiées</SectionHeading>
                            <CertificatesList certificates={certificates} now={now} />
                            <p className="text-lumiris-emerald border-lumiris-emerald/30 bg-lumiris-emerald/10 inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1 text-[11px] font-medium">
                                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                                Certifié par Lumiris
                            </p>
                        </Layer>
                    ) : null}
                </div>

                {alternativeItems.length > 0 ? (
                    <Layer delay={LAYER_DELAYS.alternatives}>
                        <SectionHeading>Pièces équivalentes d&apos;artisans français</SectionHeading>
                        <p className="text-muted-foreground text-[11px] italic">
                            Tri par score puis prix. Indépendant des commissions.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {alternativeItems.map((item, idx) => (
                                <ShopCard key={item.passport.id} item={item} index={idx} />
                            ))}
                        </div>
                    </Layer>
                ) : null}

                <p className="text-muted-foreground border-border/50 mt-2 border-t pt-4 font-mono text-[10px] leading-relaxed">
                    ID : {passport.id.toUpperCase()} / Scanné : {scannedDateLabel} / Grade {score.grade} / {brand}
                </p>
            </div>

            <ActionBar passport={passport} artisan={artisan ?? null} isSaved={isSaved} documents={documents} />

            <ScoreSheet open={breakdownOpen} onOpenChange={setBreakdownOpen} score={score} />
        </div>
    );
}

function Layer({ delay, children }: { delay: number; children: React.ReactNode }) {
    return (
        <motion.section
            className="flex flex-col gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.section>
    );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
    return <h2 className="text-foreground text-xs font-semibold uppercase tracking-[0.18em]">{children}</h2>;
}

interface RatioCardProps {
    ratio: { kind: 'great-deal' | 'overpriced' | 'fair'; label: string };
}

function PriceRatioCard({ ratio }: RatioCardProps) {
    const Icon = ratio.kind === 'great-deal' ? TrendingUp : ratio.kind === 'overpriced' ? TrendingDown : Minus;
    const tone =
        ratio.kind === 'great-deal'
            ? 'border-lumiris-emerald/30 bg-lumiris-emerald/10 text-lumiris-emerald'
            : ratio.kind === 'overpriced'
              ? 'border-lumiris-rose/30 bg-lumiris-rose/10 text-lumiris-rose'
              : 'border-lumiris-amber/30 bg-lumiris-amber/10 text-lumiris-amber';

    return (
        <div className={cn('flex items-center gap-3 rounded-xl border p-4', tone)}>
            <span className="bg-current/10 flex h-8 w-8 items-center justify-center rounded-lg">
                <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider">Prix vs grade</p>
                <p className="text-foreground/90 text-sm font-medium">{ratio.label}</p>
            </div>
        </div>
    );
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
    }).format(price);
}
