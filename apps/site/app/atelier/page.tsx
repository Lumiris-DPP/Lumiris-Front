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
        <main className="relative bg-background">
            {/* Background decoration */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-lumiris-cyan/5 blur-3xl" />
                <div className="absolute top-1/3 -left-40 h-96 w-96 rounded-full bg-lumiris-iris/5 blur-3xl" />
                <div className="absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-lumiris-rose/5 blur-3xl" />
            </div>

            {/* Hero */}
            <section className="mx-auto max-w-6xl px-6 pt-32 pb-20">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                    {/* Left: Copy */}
                    <div>
                        <span className="inline-flex items-center gap-2 rounded-full bg-lumiris-cyan/10 px-4 py-1.5 text-xs font-semibold text-lumiris-cyan">
                            <Hammer className="h-3.5 w-3.5" aria-hidden="true" />
                            Pour les TPE et PME artisanales
                        </span>
                        <h1 className="mt-6 text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl lg:text-5xl">
                            Publiez vos passeports DPP en minutes, pas en mois.
                        </h1>
                        <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted-foreground">
                            ATELIER vous guide de la facture fournisseur au QR code conforme ESPR. Score Iris calcule
                            automatiquement, jamais achetable.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4">
                            <a
                                href={SIGNUP_URL}
                                className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 text-sm font-medium text-background transition-all hover:scale-[1.02] hover:opacity-90"
                            >
                                Commencer dans ATELIER
                                <ArrowRight className="h-4 w-4" />
                            </a>
                            <Link
                                href="/methode"
                                className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                            >
                                Voir la methodologie Iris
                            </Link>
                        </div>
                    </div>

                    {/* Right: Interface mockup */}
                    <div className="relative flex justify-center lg:justify-end">
                        <div className="relative w-full max-w-md">
                            {/* Mock dashboard */}
                            <div className="rounded-2xl border border-border bg-card p-5 shadow-2xl">
                                <div className="mb-4 flex items-center gap-2 rounded-lg bg-muted p-2">
                                    <div className="flex gap-1.5">
                                        <div className="h-2.5 w-2.5 rounded-full bg-lumiris-rose" />
                                        <div className="h-2.5 w-2.5 rounded-full bg-lumiris-amber" />
                                        <div className="h-2.5 w-2.5 rounded-full bg-lumiris-cyan" />
                                    </div>
                                    <div className="ml-2 h-5 flex-1 rounded-md bg-background" />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="h-6 w-32 rounded bg-muted" />
                                        <div className="rounded-full bg-lumiris-cyan/20 px-2 py-0.5 text-xs font-medium text-lumiris-cyan">
                                            12 actifs
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="flex h-20 flex-col items-center justify-center rounded-xl bg-lumiris-emerald/10">
                                            <span className="text-2xl font-bold text-lumiris-emerald">A</span>
                                            <span className="text-xs text-muted-foreground">Grade moyen</span>
                                        </div>
                                        <div className="flex h-20 flex-col items-center justify-center rounded-xl bg-lumiris-cyan/10">
                                            <span className="text-2xl font-bold text-lumiris-cyan">87%</span>
                                            <span className="text-xs text-muted-foreground">Conformite</span>
                                        </div>
                                        <div className="flex h-20 flex-col items-center justify-center rounded-xl bg-lumiris-iris/10">
                                            <span className="text-2xl font-bold text-lumiris-iris">3</span>
                                            <span className="text-xs text-muted-foreground">En cours</span>
                                        </div>
                                    </div>
                                    <div className="h-28 rounded-xl bg-muted" />
                                </div>
                            </div>
                            {/* Decorative glow */}
                            <div className="pointer-events-none absolute -inset-8 -z-10 rounded-3xl bg-gradient-to-br from-lumiris-cyan/10 via-transparent to-lumiris-iris/10 blur-2xl" />
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
                        <span className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                            FAQ
                        </span>
                        <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
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
                    <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-lumiris-cyan/8 via-lumiris-iris/6 to-lumiris-rose/8 blur-3xl" />
                </div>

                <div className="mx-auto max-w-3xl px-6 text-center">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        Premier passeport en 30 minutes.
                    </h2>
                    <p className="mx-auto mt-4 max-w-md text-muted-foreground">
                        Rejoignez les artisans qui anticipent la reglementation ESPR des aujourd&apos;hui.
                    </p>
                    <a
                        href={SIGNUP_URL}
                        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-foreground px-8 py-4 text-sm font-medium text-background transition-all hover:scale-[1.02] hover:opacity-90"
                    >
                        Ouvrir ATELIER gratuitement
                        <ArrowRight className="h-4 w-4" />
                    </a>
                </div>
            </section>
        </main>
    );
}
