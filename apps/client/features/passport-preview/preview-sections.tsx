'use client';

import Image from 'next/image';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import type { Artisan, Material, Passport, ScoreResult } from '@lumiris/types';
import { mockSuppliers } from '@lumiris/mock-data';
import { flagEmoji } from '@lumiris/utils';
import { FIBER_LABEL, IrisGrade, MissingFieldsBadge, ScoreBreakdown, ScoreCapWarning } from '@lumiris/scoring-ui';
import { Badge } from '@lumiris/ui/components/badge';
import { Card, CardContent, CardHeader } from '@lumiris/ui/components/card';
import { Separator } from '@lumiris/ui/components/separator';
import { cn } from '@lumiris/ui/lib/cn';
import { INCOMPLETION_FULL_LABEL, PASSPORT_STATUS_LABEL } from '@/lib/passport-status';

export function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h2 className="text-base font-semibold text-foreground">{children}</h2>;
}

export function formatDimensions(g: Passport['garment']): string | null {
    const d = g.dimensions;
    const parts: string[] = [];
    if (d.length) parts.push(`L ${d.length} cm`);
    if (d.width) parts.push(`l ${d.width} cm`);
    if (d.height) parts.push(`H ${d.height} cm`);
    if (d.weightG) parts.push(`${d.weightG} g`);
    return parts.length ? parts.join(' · ') : null;
}

export function IncompletionBanner() {
    return (
        <div
            role="status"
            className="flex items-start gap-3 rounded-2xl border border-lumiris-amber/40 bg-lumiris-amber/10 p-4 text-foreground"
        >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-lumiris-amber" aria-hidden />
            <div className="text-sm">
                <p className="font-medium">{INCOMPLETION_FULL_LABEL} — certains champs ESPR/AGEC manquent encore.</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    Le score est plafonné à D tant que la fiche n&apos;est pas finalisée.
                </p>
            </div>
        </div>
    );
}

export function PreviewHero({
    passport,
    artisan,
    kindLabel,
    grade,
}: {
    passport: Passport;
    artisan: Artisan;
    kindLabel: string;
    grade: ScoreResult['grade'];
}) {
    return (
        <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card">
            <div className="relative aspect-video w-full bg-muted">
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
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                        Photo manquante
                    </div>
                )}
                {passport.status === 'InCompletion' && (
                    <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full border border-lumiris-amber/50 bg-lumiris-amber/95 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-background uppercase shadow-sm">
                        <AlertTriangle className="h-3 w-3" aria-hidden />
                        {PASSPORT_STATUS_LABEL.InCompletion}
                    </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between gap-3">
                    <div className="min-w-0 text-white drop-shadow-sm">
                        <p className="text-[11px] font-medium tracking-widest uppercase opacity-90">par</p>
                        <p className="truncate text-base font-semibold sm:text-lg">{artisan.displayName}</p>
                        {artisan.atelierName && <p className="truncate text-xs opacity-90">{artisan.atelierName}</p>}
                    </div>
                    <IrisGrade grade={grade} size="xl" tone="solid" className="shrink-0" />
                </div>
            </div>
        </section>
    );
}

export function ProductHeader({
    passport,
    kindLabel,
    dimensions,
}: {
    passport: Passport;
    kindLabel: string;
    dimensions: string | null;
}) {
    return (
        <section className="rounded-2xl border border-border/60 bg-card p-5">
            <p className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">{kindLabel}</p>
            <h1 className="mt-1 text-2xl leading-tight font-semibold text-foreground">
                {passport.garment.reference || 'Pièce sans référence'}
            </h1>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {passport.garment.retailPrice > 0 && (
                    <span className="text-lg font-semibold text-foreground">
                        {passport.garment.retailPrice} {passport.garment.currency}
                    </span>
                )}
                {dimensions && <span>{dimensions}</span>}
            </div>
        </section>
    );
}

export function ScoreCard({ passport, score }: { passport: Passport; score: ScoreResult }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                <div>
                    <p className="text-[11px] tracking-wider text-muted-foreground uppercase">Note globale</p>
                    <p className="mt-1 font-mono text-2xl font-semibold text-foreground">
                        {score.total.toFixed(1)}
                        <span className="ml-0.5 text-sm font-normal text-muted-foreground/70">/ 100</span>
                    </p>
                </div>
                <IrisGrade grade={score.grade} size="lg" tone="solid" />
            </CardHeader>
            <CardContent className="space-y-4">
                <ScoreBreakdown breakdown={score.breakdown} weights={score.weights} />
                {score.cap?.applied && <ScoreCapWarning cap={score.cap} />}
                <Separator />
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Champs ESPR / AGEC</span>
                    <MissingFieldsBadge passport={passport} showWhenComplete />
                </div>
            </CardContent>
        </Card>
    );
}

export function WarrantyNote({ warranty }: { warranty: Passport['warranty'] }) {
    if (warranty.durationMonths <= 0) return null;
    return (
        <div className="rounded-2xl border border-lumiris-cyan/30 bg-lumiris-cyan/5 p-4">
            <p className="text-xs font-semibold tracking-wider text-lumiris-cyan uppercase">
                Garantie {Math.round(warranty.durationMonths / 12)} an{warranty.durationMonths >= 24 ? 's' : ''}
            </p>
            {warranty.terms && <p className="mt-1 text-sm text-foreground/90">{warranty.terms}</p>}
            {warranty.repairabilityCommitment && (
                <p className="mt-1 text-xs text-muted-foreground italic">{warranty.repairabilityCommitment}</p>
            )}
        </div>
    );
}

export function MaterialRow({ material, now }: { material: Material; now: Date }) {
    const supplier = mockSuppliers.find((s) => s.id === material.supplierId);
    const supplierName = supplier?.name ?? material.supplierId ?? 'Fournisseur non renseigné';
    const country = material.originCountry || supplier?.country;
    const flag = flagEmoji(country);
    return (
        <li className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{FIBER_LABEL[material.fiber]}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {flag && <span aria-hidden>{flag}</span>}
                        {flag ? ' ' : ''}
                        {supplierName}
                        {country ? ` · ${country}` : ''}
                    </p>
                </div>
                <span className="font-mono text-base font-bold text-foreground">{material.percentage}%</span>
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
                                    'gap-1 font-mono text-[10px] text-foreground',
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
