'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, QrCode } from 'lucide-react';
import { IrisGrade } from '@lumiris/scoring-ui/components/iris-grade';

function getEsprCountdown(): number {
    const esprDate = new Date('2026-07-19');
    const now = new Date();
    const diffTime = esprDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

export function HomeHero() {
    const daysUntilEspr = getEsprCountdown();

    return (
        <section className="relative overflow-hidden pb-24 pt-36 sm:pt-44">
            {/* Subtle gradient background */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="bg-lumiris-cyan/5 absolute left-1/4 top-1/4 h-96 w-96 rounded-full blur-3xl" />
                <div className="bg-lumiris-iris/5 absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full blur-3xl" />
            </div>

            <div className="mx-auto w-full max-w-6xl px-6">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                    {/* Left: Copy */}
                    <div>
                        <h1 className="text-foreground text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                            Le passeport numérique du textile artisanal français
                        </h1>
                        <p className="text-muted-foreground mt-6 max-w-lg text-lg leading-relaxed">
                            LUMIRIS trace chaque pièce de sa création à votre garde-robe. Un scan, une histoire, un
                            score Iris transparent et non achetable.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4">
                            <Link
                                href="/decouvrir"
                                className="bg-foreground text-background inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-opacity hover:opacity-90"
                            >
                                Découvrir les pièces
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/atelier"
                                className="border-border text-foreground hover:bg-muted/50 inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition-colors"
                            >
                                Pour les artisans
                            </Link>
                        </div>
                    </div>

                    {/* Right: Product mockup */}
                    <div className="relative flex justify-center lg:justify-end">
                        <div className="relative">
                            {/* Mock passport card */}
                            <div className="bg-card border-border relative w-72 overflow-hidden rounded-2xl border shadow-2xl sm:w-80">
                                {/* Product image */}
                                <div className="relative aspect-[4/5]">
                                    <Image
                                        src="/images/product-chemise.jpg"
                                        alt="Chemise Lin Naturel"
                                        fill
                                        className="object-cover"
                                    />
                                    {/* IrisGrade overlay */}
                                    <div className="absolute left-3 top-3">
                                        <IrisGrade grade="A" size="sm" />
                                    </div>
                                </div>
                                {/* Card info */}
                                <div className="p-4">
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                        Atelier Margaux
                                    </p>
                                    <p className="text-foreground mt-1 font-medium">Chemise Lin Naturel</p>
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="text-muted-foreground text-xs">Made in France</span>
                                        <QrCode className="text-muted-foreground h-5 w-5" />
                                    </div>
                                </div>
                            </div>
                            {/* Decorative glow */}
                            <div className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10 blur-xl" />
                        </div>
                    </div>
                </div>

                {/* ESPR countdown banner */}
                <div className="mt-16 lg:mt-24">
                    <div className="border-border bg-muted/30 inline-flex items-center gap-3 rounded-full border px-4 py-2">
                        <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-600">
                            ESPR
                        </span>
                        <span className="text-muted-foreground text-sm">
                            <strong className="text-foreground">{daysUntilEspr} jours</strong> avant l&apos;obligation
                            DPP européenne
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
