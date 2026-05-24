'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Sparkles } from 'lucide-react';

const SIGNUP_URL = 'https://client.lumiris.fr';

// Hardcoded canonical prices as per user requirement
const PLANS = [
    {
        name: 'Solo',
        monthly: 29,
        yearly: 290,
        audience: 'Artisan seul',
        passports: "Jusqu'a 50 passeports actifs",
        features: ['1 utilisateur', 'OCR factures fournisseurs', 'QR + NFC GS1', 'Tableau de bord conformite'],
        highlighted: false,
        color: 'cyan',
    },
    {
        name: 'Studio',
        monthly: 79,
        yearly: 790,
        audience: '2 a 5 personnes',
        passports: "Jusqu'a 300 passeports actifs",
        features: ['Multi-utilisateurs', 'Bibliotheque de matieres', 'Export ESPR + AGEC', 'Support prioritaire'],
        highlighted: true,
        color: 'violet',
    },
    {
        name: 'Maison',
        monthly: 149,
        yearly: 1490,
        audience: '6 a 20 personnes',
        passports: 'Passeports illimites',
        features: ['Roles & permissions', 'API privee', 'Workflows de revue', 'Account manager dedie'],
        highlighted: false,
        color: 'pink',
    },
] as const;

export function AtelierPricing() {
    const [isYearly, setIsYearly] = useState(false);

    return (
        <section className="py-20 sm:py-28">
            <div className="mx-auto max-w-6xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5 }}
                    className="mb-12 text-center"
                >
                    <span className="bg-lumiris-iris/10 text-lumiris-iris inline-block rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider">
                        Tarifs
                    </span>
                    <h2 className="text-foreground mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                        Choisissez votre formule
                    </h2>
                    <p className="text-muted-foreground mx-auto mt-3 max-w-lg">
                        Trois paliers adaptes a la taille de votre atelier. Pas de frais caches.
                    </p>
                </motion.div>

                {/* Monthly/Yearly toggle */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-4"
                >
                    <div className="bg-muted inline-flex items-center gap-1 rounded-full p-1">
                        <button
                            onClick={() => setIsYearly(false)}
                            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                                !isYearly
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Mensuel
                        </button>
                        <button
                            onClick={() => setIsYearly(true)}
                            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                                isYearly
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Annuel
                        </button>
                    </div>
                    {isYearly && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-lumiris-emerald/10 text-lumiris-emerald inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                        >
                            <Sparkles className="h-3 w-3" />
                            -17% (2 mois offerts)
                        </motion.span>
                    )}
                </motion.div>

                {/* Pricing cards */}
                <div className="grid gap-6 md:grid-cols-3">
                    {PLANS.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className="relative"
                        >
                            {plan.highlighted && (
                                <div className="absolute -top-3 left-0 right-0 z-10 flex justify-center">
                                    <span className="bg-lumiris-iris inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-white shadow-lg">
                                        <Sparkles className="h-3 w-3" aria-hidden />
                                        Le plus choisi
                                    </span>
                                </div>
                            )}
                            <div
                                className={`bg-card h-full rounded-2xl p-6 transition-all ${
                                    plan.highlighted
                                        ? 'border-lumiris-iris/50 shadow-lumiris-iris/10 border-2 shadow-xl'
                                        : 'border-border border shadow-sm hover:shadow-md'
                                }`}
                            >
                                <div className="mb-5">
                                    <h3 className="text-foreground text-xl font-bold">ATELIER {plan.name}</h3>
                                    <p className="text-muted-foreground mt-1 text-sm">{plan.audience}</p>
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-foreground text-4xl font-bold tracking-tight">
                                            {isYearly ? plan.yearly : plan.monthly}
                                        </span>
                                        <span className="text-muted-foreground text-lg">
                                            EUR/{isYearly ? 'an' : 'mois'}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground mt-2 text-sm">{plan.passports}</p>
                                </div>

                                <ul className="mb-6 space-y-3">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3 text-sm">
                                            <div
                                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                                                    plan.color === 'cyan'
                                                        ? 'bg-lumiris-cyan/10'
                                                        : plan.color === 'violet'
                                                          ? 'bg-lumiris-iris/10'
                                                          : 'bg-lumiris-rose/10'
                                                }`}
                                            >
                                                <Check
                                                    className={`h-3 w-3 ${
                                                        plan.color === 'cyan'
                                                            ? 'text-lumiris-cyan'
                                                            : plan.color === 'violet'
                                                              ? 'text-lumiris-iris'
                                                              : 'text-lumiris-rose'
                                                    }`}
                                                    aria-hidden
                                                />
                                            </div>
                                            <span className="text-muted-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <a
                                    href={SIGNUP_URL}
                                    className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:scale-[1.02] ${
                                        plan.highlighted
                                            ? 'bg-lumiris-iris hover:bg-lumiris-iris/90 text-white'
                                            : 'bg-foreground text-background hover:opacity-90'
                                    }`}
                                >
                                    Choisir {plan.name}
                                    <ArrowRight className="h-4 w-4" />
                                </a>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
