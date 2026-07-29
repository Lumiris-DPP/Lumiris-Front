'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, GitBranch, FileSearch, Users } from 'lucide-react';

const GOVERNANCE = [
    {
        icon: GitBranch,
        title: 'Code versionné',
        description: "Chaque modification de l'algorithme est tracée sur GitHub avec historique complet.",
    },
    {
        icon: FileSearch,
        title: 'Audit annuel',
        description: 'Un cabinet indépendant audite la méthodologie et publie son rapport chaque année.',
    },
    {
        icon: Users,
        title: 'Comité consultatif',
        description: "Artisans, experts et consommateurs participent à l'évolution des critères.",
    },
];

export function MethodeGovernance() {
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
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Gouvernance et audit
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                        Comment nous garantissons l&apos;intégrité de la méthodologie dans le temps.
                    </p>
                </motion.div>

                <div className="grid gap-6 sm:grid-cols-3">
                    {GOVERNANCE.map((item, index) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                            <div className="h-full rounded-xl border border-border bg-card p-6 text-center">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                                    <item.icon className="h-6 w-6 text-foreground" />
                                </div>
                                <h3 className="font-semibold text-foreground">{item.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="mt-12 text-center"
                >
                    <Link
                        href="/charte-independance"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-lumiris-cyan transition-colors hover:text-lumiris-cyan/80"
                    >
                        Lire notre charte d&apos;indépendance
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
