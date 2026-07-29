'use client';

import { motion } from 'framer-motion';
import { Lock, GitBranch, Database, Scale, Star, Shield } from 'lucide-react';

const RULES = [
    {
        icon: Lock,
        title: 'Score non achetable',
        description:
            "Aucun acteur ne peut payer pour ameliorer son score. Le seul levier est d'ameliorer ses pratiques.",
        color: 'bg-lumiris-cyan/10 text-lumiris-cyan',
    },
    {
        icon: GitBranch,
        title: 'Algorithme open source',
        description: 'Le code de calcul est public sur GitHub, versionne et auditable par tous.',
        color: 'bg-lumiris-cyan/10 text-lumiris-cyan',
    },
    {
        icon: Database,
        title: 'Datasets publics',
        description: 'Les donnees de reference (ADEME, Higg, Water Footprint Network) sont publiques et versionnees.',
        color: 'bg-lumiris-iris/10 text-lumiris-iris',
    },
    {
        icon: Scale,
        title: 'Ponderations fixes',
        description: 'Les poids 40/25/25/10 sont definis collectivement et ne peuvent etre modifies individuellement.',
        color: 'bg-lumiris-amber/10 text-lumiris-amber',
    },
    {
        icon: Star,
        title: 'Pas de score "premium"',
        description: "L'option ATELIER+ agit uniquement a score equivalent - elle n'ameliore jamais la note.",
        color: 'bg-lumiris-rose/10 text-lumiris-rose',
    },
    {
        icon: Shield,
        title: 'Audit independant',
        description: 'La methodologie est soumise a un audit annuel par un tiers independant.',
        color: 'bg-lumiris-cyan/10 text-lumiris-cyan',
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
                    <span className="inline-block rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        Integrite
                    </span>
                    <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        6 regles non negociables
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
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
                            <div className="h-full rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
                                <div
                                    className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${rule.color.split(' ')[0]}`}
                                >
                                    <rule.icon className={`h-5 w-5 ${rule.color.split(' ')[1]}`} />
                                </div>
                                <h3 className="font-semibold text-foreground">{rule.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{rule.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
