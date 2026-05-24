'use client';

import { motion } from 'framer-motion';

const PILLARS = [
    {
        id: 'transparency',
        label: 'Transparence',
        weight: 40,
        color: 'cyan',
        description: 'Traçabilité complète des matières et étapes de fabrication.',
        icon: '◈',
    },
    {
        id: 'craftsmanship',
        label: 'Savoir-faire',
        weight: 25,
        color: 'violet',
        description: "Certifications, gestes manuels et ancienneté de l'atelier.",
        icon: '✦',
    },
    {
        id: 'impact',
        label: 'Impact',
        weight: 25,
        color: 'emerald',
        description: 'Empreinte environnementale des fibres, énergie et transport.',
        icon: '○',
    },
    {
        id: 'repairability',
        label: 'Réparabilité',
        weight: 10,
        color: 'amber',
        description: 'Pièces détachées, guide entretien et réseau réparateurs.',
        icon: '◇',
    },
] as const;

export function MethodePillars() {
    return (
        <section className="py-24 sm:py-32">
            <div className="mx-auto max-w-6xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5 }}
                    className="mb-16 text-center"
                >
                    <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
                        4 piliers, 100 points
                    </h2>
                    <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg">
                        Chaque passeport est évalué sur 4 axes avec des pondérations fixes et transparentes.
                    </p>
                </motion.div>

                {/* Modern pillar cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {PILLARS.map((pillar, index) => {
                        const colorClasses = {
                            cyan: {
                                bg: 'bg-cyan-500',
                                light: 'bg-cyan-500/10',
                                text: 'text-cyan-500',
                                border: 'border-cyan-500/20',
                            },
                            violet: {
                                bg: 'bg-violet-500',
                                light: 'bg-violet-500/10',
                                text: 'text-violet-500',
                                border: 'border-violet-500/20',
                            },
                            emerald: {
                                bg: 'bg-emerald-500',
                                light: 'bg-emerald-500/10',
                                text: 'text-emerald-500',
                                border: 'border-emerald-500/20',
                            },
                            amber: {
                                bg: 'bg-amber-500',
                                light: 'bg-amber-500/10',
                                text: 'text-amber-500',
                                border: 'border-amber-500/20',
                            },
                        }[pillar.color];

                        return (
                            <motion.div
                                key={pillar.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-50px' }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                className={`group relative overflow-hidden rounded-2xl border ${colorClasses.border} bg-card p-6 transition-all hover:shadow-lg`}
                            >
                                {/* Weight badge */}
                                <div
                                    className={`absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full ${colorClasses.light}`}
                                >
                                    <span className={`text-lg font-bold ${colorClasses.text}`}>{pillar.weight}</span>
                                </div>

                                {/* Icon */}
                                <div className={`mb-4 text-3xl ${colorClasses.text}`}>{pillar.icon}</div>

                                {/* Label */}
                                <h3 className="text-foreground text-xl font-semibold">{pillar.label}</h3>

                                {/* Description */}
                                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                                    {pillar.description}
                                </p>

                                {/* Weight indicator line */}
                                <div className="mt-6">
                                    <div className="bg-muted h-1 w-full overflow-hidden rounded-full">
                                        <div
                                            className={`h-full ${colorClasses.bg} transition-all duration-500`}
                                            style={{ width: `${pillar.weight}%` }}
                                        />
                                    </div>
                                    <p className={`mt-2 text-xs font-medium ${colorClasses.text}`}>
                                        {pillar.weight} points sur 100
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
