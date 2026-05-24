import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Hammer } from 'lucide-react';
import { AtelierSteps } from '@/features/atelier-steps';
import { AtelierPricing } from '@/features/atelier-pricing';
import { AtelierAddons } from '@/features/atelier-addons';
import { AtelierFaq } from '@/features/atelier-faq';

export const metadata: Metadata = {
    title: 'ATELIER — Publiez vos passeports DPP en minutes | LUMIRIS',
    description:
        "L'offre ATELIER permet aux artisans textile français de créer leurs passeports DPP et d'anticiper la conformité ESPR. Trois paliers Solo / Studio / Maison.",
    alternates: { canonical: '/atelier' },
};

const SIGNUP_URL = 'https://client.lumiris.fr';

export default function AtelierPage() {
    return (
        <main className="bg-background relative">
            {/* Background decoration */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-cyan-500/5 blur-3xl" />
                <div className="absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-violet-500/5 blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-pink-500/5 blur-3xl" />
            </div>

            {/* Hero */}
            <section className="mx-auto max-w-6xl px-6 pb-20 pt-32">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                    {/* Left: Copy */}
                    <div>
                        <span className="text-lumiris-cyan inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold">
                            <Hammer className="h-3.5 w-3.5" aria-hidden="true" />
                            Pour les TPE et PME artisanales
                        </span>
                        <h1 className="text-foreground mt-6 text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                            Publiez vos passeports DPP en minutes, pas en mois.
                        </h1>
                        <p className="text-muted-foreground mt-4 max-w-lg text-lg leading-relaxed">
                            ATELIER vous guide de la facture fournisseur au QR code conforme ESPR. Score Iris calcule
                            automatiquement, jamais achetable.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4">
                            <a
                                href={SIGNUP_URL}
                                className="bg-foreground text-background inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-all hover:scale-[1.02] hover:opacity-90"
                            >
                                Commencer dans ATELIER
                                <ArrowRight className="h-4 w-4" />
                            </a>
                            <Link
                                href="/methode"
                                className="text-foreground border-border hover:bg-muted/50 inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-medium transition-colors"
                            >
                                Voir la methodologie Iris
                            </Link>
                        </div>
                    </div>

                    {/* Right: Interface mockup */}
                    <div className="relative flex justify-center lg:justify-end">
                        <div className="relative w-full max-w-md">
                            {/* Mock dashboard */}
                            <div className="bg-card border-border rounded-2xl border p-5 shadow-2xl">
                                <div className="bg-muted mb-4 flex items-center gap-2 rounded-lg p-2">
                                    <div className="flex gap-1.5">
                                        <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                                        <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                                    </div>
                                    <div className="bg-background ml-2 h-5 flex-1 rounded-md" />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="bg-muted h-6 w-32 rounded" />
                                        <div className="text-lumiris-cyan rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-medium">
                                            12 actifs
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="flex h-20 flex-col items-center justify-center rounded-xl bg-emerald-500/10">
                                            <span className="text-2xl font-bold text-emerald-600">A</span>
                                            <span className="text-muted-foreground text-xs">Grade moyen</span>
                                        </div>
                                        <div className="flex h-20 flex-col items-center justify-center rounded-xl bg-cyan-500/10">
                                            <span className="text-lumiris-cyan text-2xl font-bold">87%</span>
                                            <span className="text-muted-foreground text-xs">Conformite</span>
                                        </div>
                                        <div className="flex h-20 flex-col items-center justify-center rounded-xl bg-violet-500/10">
                                            <span className="text-2xl font-bold text-violet-600">3</span>
                                            <span className="text-muted-foreground text-xs">En cours</span>
                                        </div>
                                    </div>
                                    <div className="bg-muted h-28 rounded-xl" />
                                </div>
                            </div>
                            {/* Decorative glow */}
                            <div className="pointer-events-none absolute -inset-8 -z-10 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10 blur-2xl" />
                        </div>
                    </div>
                </div>
            </section>

            {/* 4 Steps */}
            <AtelierSteps />

            {/* Pricing */}
            <AtelierPricing />

            {/* Addons */}
            <AtelierAddons />

            {/* FAQ */}
            <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
                <div className="mx-auto max-w-3xl">
                    <div className="mb-10 text-center">
                        <span className="bg-muted text-muted-foreground inline-block rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider">
                            FAQ
                        </span>
                        <h2 className="text-foreground mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                            Questions frequentes
                        </h2>
                    </div>
                    <AtelierFaq />
                </div>
            </section>

            {/* Final CTA */}
            <section className="relative overflow-hidden py-20 sm:py-28">
                {/* Prismatic halo */}
                <div className="pointer-events-none absolute inset-0 -z-10">
                    <div className="from-cyan-500/8 via-violet-500/6 to-pink-500/8 absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br blur-3xl" />
                </div>

                <div className="mx-auto max-w-3xl px-6 text-center">
                    <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
                        Premier passeport en 30 minutes.
                    </h2>
                    <p className="text-muted-foreground mx-auto mt-4 max-w-md">
                        Rejoignez les artisans qui anticipent la reglementation ESPR des aujourd&apos;hui.
                    </p>
                    <a
                        href={SIGNUP_URL}
                        className="bg-foreground text-background mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-medium transition-all hover:scale-[1.02] hover:opacity-90"
                    >
                        Ouvrir ATELIER gratuitement
                        <ArrowRight className="h-4 w-4" />
                    </a>
                </div>
            </section>
        </main>
    );
}
