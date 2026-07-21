'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { computeScore } from '@lumiris/core/scoring';
import type { Artisan, Passport } from '@lumiris/types';
import { mockCertificates } from '@lumiris/mock-data';
import {
    ArtisanCard,
    CareGuide,
    CertificatesList,
    GARMENT_KIND_LABEL,
    ManufacturingTimeline,
} from '@lumiris/scoring-ui';
import { Button } from '@lumiris/ui/components/button';
import { OriginsMap } from './origins-map';
import {
    formatDimensions,
    IncompletionBanner,
    MaterialRow,
    PreviewHero,
    ProductHeader,
    ScoreCard,
    SectionTitle,
    WarrantyNote,
} from './preview-sections';

interface PassportPreviewProps {
    passport: Passport;
    artisan: Artisan;
}

const STORY_PREVIEW_LIMIT = 280;

export function PassportPreview({ passport, artisan }: PassportPreviewProps) {
    const now = useMemo(() => new Date(), []);
    const score = useMemo(
        () => computeScore(passport, { artisan, certificates: mockCertificates, now }),
        [passport, artisan, now],
    );

    const [storyExpanded, setStoryExpanded] = useState(false);
    const longStory = artisan.story.length > STORY_PREVIEW_LIMIT;
    const storyText =
        !longStory || storyExpanded ? artisan.story : `${artisan.story.slice(0, STORY_PREVIEW_LIMIT).trimEnd()}…`;

    const dimensions = formatDimensions(passport.garment);
    const kindLabel = GARMENT_KIND_LABEL[passport.garment.kind];

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
                {passport.status === 'InCompletion' && <IncompletionBanner />}

                <PreviewHero passport={passport} artisan={artisan} kindLabel={kindLabel} grade={score.grade} />

                <ProductHeader passport={passport} kindLabel={kindLabel} dimensions={dimensions} />

                <section id="artisan-story" className="space-y-3">
                    <SectionTitle>L&apos;artisan</SectionTitle>
                    <ArtisanCard artisan={{ ...artisan, story: storyText }} />
                    {longStory && !storyExpanded && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-lumiris-cyan hover:text-lumiris-cyan/80 -ml-3"
                            onClick={scrollToStory}
                        >
                            Lire la suite
                        </Button>
                    )}
                </section>

                <section className="space-y-3">
                    <SectionTitle>Score Iris</SectionTitle>
                    <ScoreCard passport={passport} score={score} />
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
                    <WarrantyNote warranty={passport.warranty} />
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
