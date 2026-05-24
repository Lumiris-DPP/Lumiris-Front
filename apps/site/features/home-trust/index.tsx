'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Lock, Eye, Scale, FileCheck } from 'lucide-react';

const trustPoints = [
    {
        icon: Lock,
        title: 'Score non achetable',
        description: 'Aucun artisan ne peut payer pour améliorer son score Iris.',
    },
    {
        icon: Eye,
        title: 'Méthode publique',
        description: 'Algorithme de scoring open source et auditable par tous.',
    },
    {
        icon: Scale,
        title: 'Pondération fixe',
        description: 'Critères et poids définis collectivement, non modifiables.',
    },
    {
        icon: FileCheck,
        title: 'Données vérifiées',
        description: 'Chaque déclaration peut être contrôlée et tracée.',
    },
];

export function HomeTrust() {
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
                    <h2 className="text-foreground text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                        Le seul score qui ne s&apos;achète pas
                    </h2>
                    <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
                        La méthodologie Iris garantit l&apos;intégrité de chaque évaluation. Transparence radicale,
                        résultats impartiaux.
                    </p>
                </motion.div>

                <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {trustPoints.map((point, index) => (
                        <motion.div
                            key={point.title}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            className="bg-card border-border rounded-xl border p-5"
                        >
                            <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                                <point.icon className="text-foreground h-5 w-5" />
                            </div>
                            <h3 className="text-foreground mt-4 font-semibold">{point.title}</h3>
                            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{point.description}</p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="mt-10 text-center"
                >
                    <Link
                        href="/methode"
                        className="text-lumiris-cyan hover:text-lumiris-cyan/80 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
                    >
                        Découvrir la méthodologie Iris
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
