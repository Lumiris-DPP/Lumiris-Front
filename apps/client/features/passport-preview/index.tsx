'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { computeScore } from '@lumiris/core/scoring';
import type { Artisan, CountryCode, Material, Passport } from '@lumiris/types';
import { mockCertificates, mockSuppliers } from '@lumiris/mock-data';
import {
    ArtisanCard,
    CareGuide,
    CertificatesList,
    IrisGrade,
    ManufacturingTimeline,
    MissingFieldsBadge,
    ScoreBreakdown,
    ScoreCapWarning,
} from '@lumiris/scoring-ui';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent, CardHeader } from '@lumiris/ui/components/card';
import { Separator } from '@lumiris/ui/components/separator';
import { cn } from '@lumiris/ui/lib/cn';
import { INCOMPLETION_FULL_LABEL, PASSPORT_STATUS_LABEL } from '@/lib/passport-status';
import { OriginsMap } from './origins-map';

interface PassportPreviewProps {
    passport: Passport;
    artisan: Artisan;
}

const FIBER_LABEL_FR: Partial<Record<Material['fiber'], string>> = {
    wool: 'Laine',
    linen: 'Lin',
    cotton: 'Coton',
    silk: 'Soie',
    hemp: 'Chanvre',
    cashmere: 'Cachemire',
    'recycled-polyester': 'Polyester recyclé',
    other: 'Autre',
};

const KIND_LABEL_FR: Record<Passport['garment']['kind'], string> = {
    sweater: 'Pull',
    shirt: 'Chemise',
    shoe: 'Chaussures',
    jacket: 'Veste',
    trouser: 'Pantalon',
    accessory: 'Accessoire',
    other: 'Pièce',
};

const STORY_PREVIEW_LIMIT = 280;

function flagEmoji(code: CountryCode | undefined): string {
    if (!code || code.length !== 2) return '';
    return String.fromCodePoint(
        ...code
            .toUpperCase()
            .split('')
            .map((c) => 127397 + c.charCodeAt(0)),
    );
}

function formatDimensions(g: Passport['garment']): string | null {
    const d = g.dimensions;
    const parts: string[] = [];
    if (d.length) parts.push(`L ${d.length} cm`);
    if (d.width) parts.push(`l ${d.width} cm`);
    if (d.height) parts.push(`H ${d.height} cm`);
    if (d.weightG) parts.push(`${d.weightG} g`);
    return parts.length ? parts.join(' · ') : null;
}

export function PassportPreview({ passport, artisan }: PassportPreviewProps) {
    const now = useMemo(() => new Date(), []);
    const score = useMemo(
        () =>
            computeScore(passport, {
                artisan,
                certificates: mockCertificates,
                now,
            }),
        [passport, artisan, now],
    );

    const [storyExpanded, setStoryExpanded] = useState(false);
    const longStory = artisan.story.length > STORY_PREVIEW_LIMIT;
    const storyText =
        !longStory || storyExpanded ? artisan.story : `${artisan.story.slice(0, STORY_PREVIEW_LIMIT).trimEnd()}…`;

    const dimensions = formatDimensions(passport.garment);
    const kindLabel = KIND_LABEL_FR[passport.garment.kind] ?? KIND_LABEL_FR.other;

    const scrollToStory = () => {
        setStoryExpanded(true);
        requestAnimationFrame(() => {
            document.getElementById('artisan-story')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    };

    return (
        <div className="bg-background min-h-screen">
            <header className="bg-lumiris-amber/10 border-lumiris-amber/40 sticky top-0 z-40 border-b backdrop-blur">
                <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
                    <p className="text-foreground text-xs sm:text-sm">
                        <span className="font-semibold">Aperçu</span> — voici ce que verra votre client après scan QR.
                    </p>
                    <Button asChild size="sm" variant="ghost" className="shrink-0 text-xs">
                        <Link href={`/passports/${passport.id}`}>
                            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Retour
                        </Link>
                    </Button>
                </div>
            </header>

            <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
                {passport.status === 'InCompletion' && (
                    <div
                        role="status"
                        className="border-lumiris-amber/40 bg-lumiris-amber/10 text-foreground flex items-start gap-3 rounded-2xl border p-4"
                    >
                        <AlertTriangle className="text-lumiris-amber mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                        <div className="text-sm">
                            <p className="font-medium">
                                {INCOMPLETION_FULL_LABEL} — certains champs ESPR/AGEC manquent encore.
                            </p>
                            <p className="text-muted-foreground mt-0.5 text-xs">
                                Le score est plafonné à D tant que la fiche n&apos;est pas finalisée.
                            </p>
                        </div>
                    </div>
                )}

                <section className="border-border/60 bg-card relative overflow-hidden rounded-2xl border">
                    <div className="bg-muted relative aspect-video w-full">
                        {passport.garment.mainPhotoUrl ? (
                            <Image
                                src={passport.garment.mainPhotoUrl}
                                alt={`${kindLabel} ${passport.garment.reference}`}
                                fill
                                unoptimized
                                sizes="(min-width: 768px) 768px, 100vw"
                                className="object-cover"
                                priority
                            />
                        ) : (
                            <div className="text-muted-foreground absolute inset-0 flex items-center justify-center text-xs">
                                Photo manquante
                            </div>
                        )}
                        {passport.status === 'InCompletion' && (
                            <div className="border-lumiris-amber/50 bg-lumiris-amber/95 text-background absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider shadow-sm">
                                <AlertTriangle className="h-3 w-3" aria-hidden />
                                {PASSPORT_STATUS_LABEL.InCompletion}
                            </div>
                        )}
                        <div className="bg-linear-to-t absolute inset-x-0 bottom-0 h-2/5 from-black/70 via-black/30 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
                            <div className="min-w-0 text-white drop-shadow-sm">
                                <p className="text-[11px] font-medium uppercase tracking-widest opacity-90">par</p>
                                <p className="truncate text-base font-semibold sm:text-lg">{artisan.displayName}</p>
                                {artisan.atelierName && (
                                    <p className="truncate text-xs opacity-90">{artisan.atelierName}</p>
                                )}
                            </div>
                            <IrisGrade grade={score.grade} size="xl" tone="solid" className="shrink-0" />
                        </div>
                    </div>
                </section>

                <section className="border-border/60 bg-card rounded-2xl border p-5">
                    <p className="text-muted-foreground font-mono text-[11px] uppercase tracking-wider">{kindLabel}</p>
                    <h1 className="text-foreground mt-1 text-2xl font-semibold leading-tight">
                        {passport.garment.reference || 'Pièce sans référence'}
                    </h1>
                    <div className="text-muted-foreground mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
                        {passport.garment.retailPrice > 0 && (
                            <span className="text-foreground text-lg font-semibold">
                                {passport.garment.retailPrice} {passport.garment.currency}
                            </span>
                        )}
                        {dimensions && <span>{dimensions}</span>}
                    </div>
                </section>

                <section id="artisan-story" className="space-y-3">
                    <SectionTitle>L&apos;artisan</SectionTitle>
                    <ArtisanCard artisan={{ ...artisan, story: storyText }} />
                    {longStory && !storyExpanded && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-lumiris-emerald hover:text-lumiris-emerald/80 -ml-3"
                            onClick={scrollToStory}
                        >
                            Lire la suite
                        </Button>
                    )}
                </section>

                <section className="space-y-3">
                    <SectionTitle>Score Iris</SectionTitle>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                            <div>
                                <p className="text-muted-foreground text-[11px] uppercase tracking-wider">
                                    Note globale
                                </p>
                                <p className="text-foreground mt-1 font-mono text-2xl font-semibold">
                                    {score.total.toFixed(1)}
                                    <span className="text-muted-foreground/70 ml-0.5 text-sm font-normal">/ 100</span>
                                </p>
                            </div>
                            <IrisGrade grade={score.grade} size="lg" tone="solid" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ScoreBreakdown breakdown={score.breakdown} weights={score.weights} />
                            {score.cap?.applied && <ScoreCapWarning cap={score.cap} />}
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-xs">Champs ESPR / AGEC</span>
                                <MissingFieldsBadge passport={passport} showWhenComplete />
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="space-y-3">
                    <SectionTitle>Origines &amp; fabrication</SectionTitle>
                    <OriginsMap materials={passport.materials} steps={passport.steps} />
                </section>

                <section className="space-y-3">
                    <SectionTitle>Matières</SectionTitle>
                    {passport.materials.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Composition non renseignée.</p>
                    ) : (
                        <ul className="space-y-3">
                            {passport.materials.map((m, i) => (
                                <MaterialRow key={`${i}-${m.fiber}`} material={m} now={now} />
                            ))}
                        </ul>
                    )}
                </section>

                <section className="space-y-3">
                    <SectionTitle>Étapes de fabrication</SectionTitle>
                    <ManufacturingTimeline steps={passport.steps} />
                </section>

                <section className="space-y-3">
                    <SectionTitle>Certificats &amp; garanties</SectionTitle>
                    <CertificatesList certificates={passport.certifications} now={now} />
                    {passport.warranty.durationMonths > 0 && (
                        <div className="border-lumiris-emerald/30 bg-lumiris-emerald/5 rounded-2xl border p-4">
                            <p className="text-lumiris-emerald text-xs font-semibold uppercase tracking-wider">
                                Garantie {Math.round(passport.warranty.durationMonths / 12)} an
                                {passport.warranty.durationMonths >= 24 ? 's' : ''}
                            </p>
                            {passport.warranty.terms && (
                                <p className="text-foreground/90 mt-1 text-sm">{passport.warranty.terms}</p>
                            )}
                            {passport.warranty.repairabilityCommitment && (
                                <p className="text-muted-foreground mt-1 text-xs italic">
                                    {passport.warranty.repairabilityCommitment}
                                </p>
                            )}
                        </div>
                    )}
                </section>

                <section className="space-y-3">
                    <SectionTitle>Entretien</SectionTitle>
                    <CareGuide care={passport.care} />
                </section>

                <footer className="border-border/60 mt-8 flex flex-col items-center gap-2 border-t pt-6 text-center">
                    <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                        <ShieldCheck className="text-lumiris-emerald h-3.5 w-3.5" />
                        Passeport vérifié sur LUMIRIS
                    </p>
                    <a
                        href={passport.gs1.verificationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground break-all font-mono text-[10px] underline underline-offset-2"
                    >
                        {passport.gs1.verificationUrl}
                    </a>
                </footer>
            </main>
        </div>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h2 className="text-foreground text-base font-semibold">{children}</h2>;
}

function MaterialRow({ material, now }: { material: Material; now: Date }) {
    const supplier = mockSuppliers.find((s) => s.id === material.supplierId);
    const supplierName = supplier?.name ?? material.supplierId ?? 'Fournisseur non renseigné';
    const country = material.originCountry || supplier?.country;
    const flag = flagEmoji(country);
    return (
        <li className="border-border bg-card rounded-2xl border p-4">
            <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-foreground truncate text-sm font-semibold">
                        {FIBER_LABEL_FR[material.fiber] ?? '—'}
                    </p>
                    <p className="text-muted-foreground mt-0.5 truncate text-xs">
                        {flag && <span aria-hidden>{flag}</span>}
                        {flag ? ' ' : ''}
                        {supplierName}
                        {country ? ` · ${country}` : ''}
                    </p>
                </div>
                <span className="text-foreground font-mono text-base font-bold">{material.percentage}%</span>
            </div>
            {material.certifications.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {material.certifications.map((cert) => {
                        const expiresAt = new Date(cert.expiresAt);
                        const expired = Number.isFinite(expiresAt.getTime()) && now.getTime() > expiresAt.getTime();
                        const unverified = !expired && !cert.verified;
                        return (
                            <Badge
                                key={cert.id}
                                variant="outline"
                                className={cn(
                                    'text-foreground gap-1 font-mono text-[10px]',
                                    expired && 'border-lumiris-rose/40 bg-lumiris-rose/10',
                                    unverified && 'border-lumiris-amber/40 bg-lumiris-amber/10',
                                    !expired && !unverified && 'border-lumiris-emerald/40 bg-lumiris-emerald/10',
                                )}
                            >
                                <ShieldCheck
                                    aria-hidden
                                    className={cn(
                                        'h-3 w-3',
                                        expired && 'text-lumiris-rose',
                                        unverified && 'text-lumiris-amber',
                                        !expired && !unverified && 'text-lumiris-emerald',
                                    )}
                                />
                                {cert.kind === 'CUSTOM' && cert.customName ? cert.customName : cert.kind}
                                {expired ? ' · expirée' : null}
                            </Badge>
                        );
                    })}
                </div>
            )}
        </li>
    );
}
