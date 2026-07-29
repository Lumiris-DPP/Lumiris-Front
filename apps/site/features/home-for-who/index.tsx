'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Scissors, ScanLine, ArrowRight } from 'lucide-react';

const personas = [
    {
        icon: Scissors,
        title: 'Pour les artisans',
        description:
            "Valorisez votre savoir-faire avec un passeport numérique qui raconte l'histoire de vos créations. Conforme aux exigences ESPR/AGEC.",
        cta: 'Découvrir ATELIER',
        href: '/atelier',
        accent: 'cyan',
    },
    {
        icon: ScanLine,
        title: 'Pour les acheteurs',
        description:
            "Scannez n'importe quel DPP européen et découvrez le score Iris : composition, fabrication, impact environnemental et social.",
        cta: 'Découvrir VISION',
        href: '/vision',
        accent: 'violet',
    },
];

export function HomeForWho() {
    return (
        <section className="bg-muted/30 py-24 sm:py-32">
            <div className="mx-auto max-w-6xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                >
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Deux mondes, une mission
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                        Que vous créiez des pièces ou que vous les portiez, LUMIRIS vous connecte à la transparence.
                    </p>
                </motion.div>

                <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:gap-8">
                    {personas.map((persona, index) => (
                        <motion.div
                            key={persona.title}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                            <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg sm:p-8">
                                <div
                                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                                        persona.accent === 'cyan' ? 'bg-lumiris-cyan/10' : 'bg-lumiris-iris/10'
                                    }`}
                                >
                                    <persona.icon
                                        className={`h-6 w-6 ${
                                            persona.accent === 'cyan' ? 'text-lumiris-cyan' : 'text-lumiris-iris'
                                        }`}
                                    />
                                </div>
                                <h3 className="mt-5 text-xl font-semibold text-foreground">{persona.title}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                    {persona.description}
                                </p>
                                <Link
                                    href={persona.href}
                                    className={`mt-5 inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
                                        persona.accent === 'cyan'
                                            ? 'text-lumiris-cyan hover:text-lumiris-cyan/90'
                                            : 'text-lumiris-iris hover:text-lumiris-iris/90'
                                    }`}
                                >
                                    {persona.cta}
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
