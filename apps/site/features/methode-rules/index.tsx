'use client';

import { motion } from 'framer-motion';
import { Lock, GitBranch, Database, Scale, Star, Shield } from 'lucide-react';

const RULES = [
    {
        icon: Lock,
        title: 'Score non achetable',
        description:
            "Aucun acteur ne peut payer pour ameliorer son score. Le seul levier est d'ameliorer ses pratiques.",
        color: 'bg-emerald-500/10 text-emerald-600',
    },
    {
        icon: GitBranch,
        title: 'Algorithme open source',
        description: 'Le code de calcul est public sur GitHub, versionne et auditable par tous.',
        color: 'bg-cyan-500/10 text-cyan-600',
    },
    {
        icon: Database,
        title: 'Datasets publics',
        description: 'Les donnees de reference (ADEME, Higg, Water Footprint Network) sont publiques et versionnees.',
        color: 'bg-violet-500/10 text-violet-600',
    },
    {
        icon: Scale,
        title: 'Ponderations fixes',
        description: 'Les poids 40/25/25/10 sont definis collectivement et ne peuvent etre modifies individuellement.',
        color: 'bg-amber-500/10 text-amber-600',
    },
    {
        icon: Star,
        title: 'Pas de score "premium"',
        description: "L'option ATELIER+ agit uniquement a score equivalent - elle n'ameliore jamais la note.",
        color: 'bg-pink-500/10 text-pink-600',
    },
    {
        icon: Shield,
        title: 'Audit independant',
        description: 'La methodologie est soumise a un audit annuel par un tiers independant.',
        color: 'bg-blue-500/10 text-blue-600',
    },
];

export function MethodeRules() {
    return (
        <section className="bg-muted/30 py-20 sm:py-28">
            <div className="mx-auto max-w-6xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5 }}
                    className="mb-12 text-center"
                >
                    <span className="bg-foreground/5 text-muted-foreground inline-block rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider">
                        Integrite
                    </span>
                    <h2 className="text-foreground mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                        6 regles non negociables
                    </h2>
                    <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
                        Ces principes garantissent l&apos;integrite du score Iris.
                    </p>
                </motion.div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {RULES.map((rule, index) => (
                        <motion.div
                            key={rule.title}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                        >
                            <div className="bg-card border-border h-full rounded-xl border p-5 transition-shadow hover:shadow-md">
                                <div
                                    className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${rule.color.split(' ')[0]}`}
                                >
                                    <rule.icon className={`h-5 w-5 ${rule.color.split(' ')[1]}`} />
                                </div>
                                <h3 className="text-foreground font-semibold">{rule.title}</h3>
                                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{rule.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
