'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';

interface RevenueLine {
    label: string;
    pricing: string;
    target: string;
}

const LINES: readonly RevenueLine[] = [
    {
        label: 'ATELIER Solo / Studio / Maison',
        pricing: '29 / 79 / 149 €/mois',
        target: 'Abonnement B2B artisans (textile, puis multi-secteurs)',
    },
    {
        label: 'ATELIER+ option',
        pricing: '19 €/mois · 190 €/an',
        target: 'Mise en avant prioritaire dans VISION, statistiques avancées',
    },
    {
        label: 'Affiliation à l’achat',
        pricing: '3-7 % du panier',
        target: 'Commission classique côté artisan ou marchand, jamais côté utilisateur',
    },
    {
        label: 'Affiliation retouche & réparation',
        pricing: '4-10 € forfait ou 8 % du devis',
        target: 'Mise en relation utilisateur ↔ retoucheur ou réparateur',
    },
    {
        label: 'LUMIRIS Local',
        pricing: '19 €/mois · 190 €/an',
        target: 'Retoucheurs, couturiers, réparateurs : profil enrichi + remontée prioritaire',
    },
];

export function BusinessModel() {
    return (
        <section className="py-24" aria-labelledby="business-model-title">
            <div className="mx-auto max-w-5xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mb-12 max-w-2xl"
                >
                    <p className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-[0.25em]">
                        Modèle économique
                    </p>
                    <h2
                        id="business-model-title"
                        className="text-foreground text-balance text-3xl font-bold sm:text-4xl"
                    >
                        Cinq lignes de revenus, zéro placement sponsorisé
                    </h2>
                    <p className="text-muted-foreground mt-3 leading-relaxed">
                        LUMIRIS combine abonnements B2B et affiliations B2C — toutes en dehors de l’évaluation des
                        passeports. Le tri ne dépend jamais des commissions.
                    </p>
                </motion.div>

                <ul className="border-border bg-card divide-border divide-y rounded-2xl border shadow-sm">
                    {LINES.map((line) => (
                        <li
                            key={line.label}
                            className="grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-[1.4fr_1fr_2fr] sm:items-center sm:gap-6"
                        >
                            <p className="text-foreground text-sm font-semibold leading-snug">{line.label}</p>
                            <p className="text-foreground/80 font-mono text-xs">{line.pricing}</p>
                            <p className="text-muted-foreground text-xs leading-relaxed">{line.target}</p>
                        </li>
                    ))}
                </ul>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="border-grade-a/30 bg-grade-a/5 mt-8 flex flex-col gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center sm:gap-6"
                >
                    <Lock className="text-grade-a h-6 w-6 shrink-0" aria-hidden="true" />
                    <div className="flex-1">
                        <p className="text-foreground text-base font-semibold">
                            Aucun acteur ne peut payer pour modifier son score Iris.
                        </p>
                        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                            Règle gravée dans la charte. Algorithme open-source{' '}
                            <span className="font-mono">@lumiris/core</span> auditable, datasets versionnés, mise en
                            avant ATELIER+ à score équivalent uniquement.
                        </p>
                    </div>
                    <Link
                        href="/charte-independance"
                        className="border-border bg-background text-foreground hover:bg-secondary inline-flex items-center gap-1.5 self-start rounded-full border px-4 py-2 text-xs font-medium transition-colors sm:self-center"
                    >
                        Lire la charte
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
