import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, Hammer, Lock, ScanLine, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@lumiris/ui/components/card';
import { AtelierAddons } from '@/features/atelier-addons';
import { AtelierFaq } from '@/features/atelier-faq';

export const metadata: Metadata = {
    title: 'ATELIER — l’offre artisans LUMIRIS (DPP textile, puis multi-secteurs)',
    description:
        'L’offre ATELIER permet aux artisans textile français de créer leurs passeports DPP et d’anticiper la conformité ESPR. Trois paliers Solo / Studio / Maison, option ATELIER+, extension multi-secteurs en V2.',
    alternates: { canonical: '/atelier' },
};

const SIGNUP_URL = 'https://client.lumiris.fr';

const PILLARS: ReadonlyArray<{ icon: typeof Hammer; title: string; body: string }> = [
    {
        icon: Hammer,
        title: 'Création guidée',
        body: '6 étapes, OCR factures, QR/NFC.',
    },
    {
        icon: ScanLine,
        title: 'Score Iris transparent',
        body: '40/25/25/10, jamais payable.',
    },
    {
        icon: ShieldCheck,
        title: 'Conformité ESPR + AGEC',
        body: 'Prêt pour 2027.',
    },
];

interface Tier {
    name: string;
    monthly: number;
    yearly: number;
    audience: string;
    passports: string;
    features: readonly string[];
    highlighted?: boolean;
}

const TIERS: readonly Tier[] = [
    {
        name: 'ATELIER Solo',
        monthly: 29,
        yearly: 290,
        audience: 'Artisan seul',
        passports: 'Jusqu’à 50 passeports actifs',
        features: ['1 utilisateur', 'OCR factures fournisseurs', 'QR + NFC GS1', 'Tableau de bord conformité'],
    },
    {
        name: 'ATELIER Studio',
        monthly: 79,
        yearly: 790,
        audience: '2 à 5 personnes',
        passports: 'Jusqu’à 300 passeports actifs',
        features: ['Multi-utilisateurs', 'Bibliothèque de matières', 'Export ESPR + AGEC', 'Support prioritaire'],
        highlighted: true,
    },
    {
        name: 'ATELIER Maison',
        monthly: 149,
        yearly: 1490,
        audience: '6 à 20 personnes',
        passports: 'Passeports illimités',
        features: ['Rôles & permissions', 'API privée', 'Workflows de revue', 'Account manager dédié'],
    },
];

export default function AtelierPage() {
    return (
        <div className="bg-background">
            <section className="mx-auto max-w-6xl px-6 pb-24 pt-32">
                <div className="mx-auto max-w-3xl text-center">
                    <span className="border-border bg-card text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
                        <Hammer className="text-grade-a h-3.5 w-3.5" aria-hidden="true" />
                        Pour les TPE et PME artisanales
                    </span>
                    <h1 className="text-foreground mt-6 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
                        ATELIER — l’offre artisans
                    </h1>
                    <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base leading-relaxed">
                        Créez vos passeports DPP textile, anticipez ESPR et AGEC.
                    </p>
                    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <a
                            href={SIGNUP_URL}
                            className="bg-foreground text-background inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
                        >
                            Commencer dans ATELIER
                            <ArrowRight className="h-3.5 w-3.5" />
                        </a>
                        <Link
                            href="/charte-independance"
                            className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
                        >
                            Lire la charte d’indépendance
                        </Link>
                    </div>
                </div>
            </section>

            <section aria-labelledby="atelier-pillars" className="mx-auto max-w-6xl px-6 py-32">
                <h2 id="atelier-pillars" className="sr-only">
                    Ce que propose ATELIER
                </h2>
                <ul className="grid gap-6 sm:grid-cols-3">
                    {PILLARS.map(({ icon: Icon, title, body }) => (
                        <li key={title}>
                            <Card className="h-full">
                                <CardContent className="flex h-full flex-col gap-3 p-6">
                                    <Icon className="text-grade-b h-5 w-5" aria-hidden="true" />
                                    <h3 className="text-foreground text-base font-semibold">{title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
                                </CardContent>
                            </Card>
                        </li>
                    ))}
                </ul>
            </section>

            <section aria-labelledby="atelier-trust" className="mx-auto max-w-6xl px-6 py-32">
                <div className="bg-muted/30 flex flex-col gap-4 rounded-2xl p-8 sm:flex-row sm:items-center sm:gap-6">
                    <Lock className="text-grade-a h-7 w-7 shrink-0" aria-hidden="true" />
                    <p id="atelier-trust" className="text-foreground flex-1 text-base font-semibold">
                        Aucun acteur ne peut payer pour modifier son score Iris — algorithme et datasets publics,
                        versionnés.
                    </p>
                </div>
            </section>

            <section aria-labelledby="atelier-pricing" className="mx-auto max-w-6xl px-6 py-32">
                <div className="mb-10 max-w-2xl">
                    <p className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-[0.25em]">Tarifs</p>
                    <h2 id="atelier-pricing" className="text-foreground text-balance text-3xl font-bold sm:text-4xl">
                        Trois paliers
                    </h2>
                    <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                        Trois tailles d&apos;atelier. Pas de coût caché.
                    </p>
                </div>

                <ul className="grid gap-6 md:grid-cols-3">
                    {TIERS.map((tier) => (
                        <li key={tier.name}>
                            <Card className={`h-full ${tier.highlighted ? 'border-grade-a/40 shadow-md' : ''}`}>
                                <CardContent className="flex h-full flex-col gap-4 p-6">
                                    <div>
                                        <div className="flex items-baseline justify-between">
                                            <h3 className="text-foreground text-lg font-semibold">{tier.name}</h3>
                                            {tier.highlighted ? (
                                                <span className="bg-grade-a/10 text-grade-a rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                                                    Le plus choisi
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="text-muted-foreground mt-1 text-xs">{tier.audience}</p>
                                    </div>

                                    <div>
                                        <p className="text-foreground text-3xl font-bold tracking-tight">
                                            {tier.monthly}
                                            <span className="text-muted-foreground text-sm font-normal"> €/mois</span>
                                        </p>
                                        <p className="text-muted-foreground text-xs">
                                            ou <span className="font-mono">{tier.yearly} €/an</span> ·{' '}
                                            <span className="text-foreground/80">{tier.passports}</span>
                                        </p>
                                    </div>

                                    <ul className="border-border space-y-2 border-t pt-4 text-sm">
                                        {tier.features.map((f) => (
                                            <li key={f} className="text-muted-foreground flex items-start gap-2">
                                                <Check className="text-grade-a mt-0.5 h-3.5 w-3.5 shrink-0" />
                                                <span>{f}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <a
                                        href={SIGNUP_URL}
                                        className={`mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 ${
                                            tier.highlighted
                                                ? 'bg-foreground text-background'
                                                : 'border-border text-foreground hover:bg-secondary border'
                                        }`}
                                    >
                                        Choisir {tier.name.replace('ATELIER ', '')}
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </a>
                                </CardContent>
                            </Card>
                        </li>
                    ))}
                </ul>

                <div className="mt-16">
                    <h3 className="text-muted-foreground mb-6 text-xs font-medium uppercase tracking-[0.25em]">
                        Options
                    </h3>
                    <AtelierAddons />
                </div>
            </section>

            <section aria-labelledby="atelier-faq" className="mx-auto max-w-6xl px-6 py-32">
                <div className="mx-auto max-w-3xl">
                    <div className="mb-8">
                        <p className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-[0.25em]">
                            Questions fréquentes
                        </p>
                        <h2 id="atelier-faq" className="text-foreground text-balance text-3xl font-bold sm:text-4xl">
                            Avant de commencer
                        </h2>
                    </div>
                    <AtelierFaq />
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-6 pb-32 pt-24">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
                        Premier passeport en 30 minutes.
                    </h2>
                    <a
                        href={SIGNUP_URL}
                        className="bg-foreground text-background mt-8 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
                    >
                        Ouvrir ATELIER
                        <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                </div>
            </section>
        </div>
    );
}
