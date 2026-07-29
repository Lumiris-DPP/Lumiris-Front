'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, Smartphone } from 'lucide-react';
import {
    PassportHeader,
    PassportStatusBanner,
    ScoreBreakdown,
    ArtisanCard,
    MaterialBreakdown,
    ProductionTimeline,
    CertificatesList,
    CareGuide,
    useUniqueCertificates,
} from '@lumiris/scoring-ui';
import type { PassportPublicView } from '@lumiris/mock-data';

const OriginMap = dynamic(() => import('./origin-map').then((m) => m.OriginMap), {
    ssr: false,
    loading: () => (
        <div className="flex h-72 items-center justify-center rounded-2xl border border-border bg-card text-xs text-muted-foreground italic">
            Chargement de la carte…
        </div>
    ),
});

interface PassportPublicViewProps {
    view: PassportPublicView;
    artisanSlug: string;
}

const SCORING_NOW = new Date('2026-04-30T08:00:00Z');

export function PassportPublicViewSection({ view, artisanSlug }: PassportPublicViewProps) {
    const { passport, artisan, irisScore, inProgress } = view;
    const now = SCORING_NOW;

    const certificates = useUniqueCertificates(passport);

    return (
        <article className="mx-auto max-w-5xl space-y-8 px-6 pt-28 pb-20" aria-labelledby="passport-title">
            <h1 id="passport-title" className="sr-only">
                Passeport {passport.garment.reference}
            </h1>

            <PassportHeader passport={passport} artisan={artisan} grade={irisScore?.grade ?? 'E'} />

            <PassportStatusBanner passport={passport} score={irisScore} />

            {irisScore ? (
                <Section title="Score Iris" subtitle="Quatre piliers, cent points">
                    <ScoreBreakdown breakdown={irisScore.breakdown} />
                </Section>
            ) : null}

            <Section title="L’artisan">
                <ArtisanCard artisan={artisan} truncateStory />
                <Link
                    href={`/artisans/${artisanSlug}`}
                    className="mt-4 inline-flex items-center gap-2 self-start rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90"
                >
                    Voir l’atelier
                    <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </Section>

            {passport.materials.length > 0 ? (
                <Section title="Matières">
                    <MaterialBreakdown materials={passport.materials} now={now} />
                </Section>
            ) : null}

            {passport.steps.length > 0 ? (
                <Section title="Étapes de fabrication">
                    <ProductionTimeline steps={passport.steps} />
                </Section>
            ) : null}

            <Section title="Origine et trajet">
                <OriginMap materials={passport.materials} steps={passport.steps} />
            </Section>

            {certificates.length > 0 ? (
                <Section title="Certifications">
                    <CertificatesList certificates={certificates} now={now} />
                </Section>
            ) : null}

            {passport.care || passport.warranty ? (
                <Section title="Entretien et garantie">
                    <CareGuide care={passport.care} warranty={passport.warranty} />
                </Section>
            ) : null}

            <RepairCallout />

            <p className="text-center text-xs text-muted-foreground">
                Passeport identifié par le GS1 Digital Link{' '}
                <code className="font-mono">{passport.gs1.verificationUrl}</code>.
            </p>
            <p className="text-center text-xs text-muted-foreground">
                LUMIRIS ne vend pas ses scores -{' '}
                <Link href="/charte-independance" className="text-foreground underline-offset-4 hover:underline">
                    charte d’indépendance
                </Link>
                .{inProgress ? ' Pièce en cours de complétion.' : null}
            </p>
        </article>
    );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-4">
            <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
                {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
            </div>
            {children}
        </section>
    );
}

function RepairCallout() {
    return (
        <aside className="border-grade-b/30 bg-grade-b/5 flex flex-col gap-3 rounded-2xl border p-6">
            <p className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
                <Smartphone className="text-grade-b h-4 w-4" aria-hidden="true" />
                Besoin d’une retouche ?
            </p>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                LUMIRIS Vision — l’app mobile compagnon — permettra bientôt de localiser un retoucheur référencé près de
                chez vous, avec géolocalisation et plages de disponibilité en temps réel. Ouverture publique annoncée
                pour le second semestre 2026.
            </p>
        </aside>
    );
}
