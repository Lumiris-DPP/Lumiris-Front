'use client';

import { motion } from 'framer-motion';

interface GradeRow {
    grade: 'A' | 'B' | 'C' | 'D' | 'E';
    threshold: string;
    label: string;
    description: string;
    bg: string;
    text: string;
    border: string;
}

// Seuils canoniques Iris V2 (cf. packages/core/src/scoring/grade.ts) :
// A >= 80 / B 65-79.9 / C 50-64.9 / D 35-49.9 / E < 35. Pas de A+.
const GRADES: readonly GradeRow[] = [
    {
        grade: 'A',
        threshold: '≥ 80',
        label: 'Excellence',
        description: 'Passeport complet, certifications valides, traçabilité fibre à fibre.',
        bg: 'bg-lumiris-emerald',
        text: 'text-lumiris-emerald',
        border: 'border-lumiris-emerald/20',
    },
    {
        grade: 'B',
        threshold: '65 — 79',
        label: 'Solide',
        description: 'Quelques zones grises, toutes les obligations ESPR couvertes.',
        bg: 'bg-lumiris-cyan',
        text: 'text-lumiris-cyan',
        border: 'border-lumiris-cyan/20',
    },
    {
        grade: 'C',
        threshold: '50 — 64',
        label: 'Moyen',
        description: 'Composition tracée, fabrication partiellement documentée.',
        bg: 'bg-lumiris-iris',
        text: 'text-lumiris-iris',
        border: 'border-lumiris-iris/20',
    },
    {
        grade: 'D',
        threshold: '35 — 49',
        label: 'Insuffisant',
        description: 'Plafond automatique appliqué : un champ ESPR/AGEC manque.',
        bg: 'bg-lumiris-amber',
        text: 'text-lumiris-amber',
        border: 'border-lumiris-amber/20',
    },
    {
        grade: 'E',
        threshold: '< 35',
        label: 'Opaque',
        description: 'Passeport publié mais traçabilité majoritairement absente.',
        bg: 'bg-lumiris-rose',
        text: 'text-lumiris-rose',
        border: 'border-lumiris-rose/20',
    },
];

export function MethodeGrades() {
    return (
        <section className="bg-muted/30 py-24 sm:py-32">
            <div className="mx-auto max-w-6xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5 }}
                    className="mb-14 text-center"
                >
                    <p className="text-muted-foreground mb-4 font-mono text-xs uppercase tracking-[0.25em]">
                        Grades Iris
                    </p>
                    <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
                        Du score 0 — 100 à une lettre lisible
                    </h2>
                    <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-base leading-relaxed">
                        Cinq paliers, des seuils gravés dans le code et publics.
                        <span className="text-foreground font-medium">
                            {' '}
                            Pas de A+ : la perfection mesurée n&apos;existe pas.
                        </span>
                    </p>
                </motion.div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
                    {GRADES.map((item, i) => (
                        <motion.article
                            key={item.grade}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                            className={`bg-card group relative flex min-h-[260px] flex-col overflow-hidden rounded-3xl border ${item.border} transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg`}
                        >
                            {/* Halo gradient en arrière-plan, visible au hover */}
                            <div
                                aria-hidden
                                className={`pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-25 ${item.bg}`}
                            />

                            {/* Header — lettre géante + threshold mono */}
                            <div className="relative px-6 pt-8">
                                <div className="flex items-baseline justify-between">
                                    <span
                                        className={`text-[5.5rem] font-black leading-none tracking-tight sm:text-[6rem] ${item.text}`}
                                    >
                                        {item.grade}
                                    </span>
                                    <span className="text-muted-foreground/60 font-mono text-xs tabular-nums">
                                        {item.threshold}
                                    </span>
                                </div>
                            </div>

                            {/* Body — label + description */}
                            <div className="relative flex-1 px-6 pb-8 pt-8">
                                <p className={`text-base font-semibold ${item.text}`}>{item.label}</p>
                                <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{item.description}</p>
                            </div>
                        </motion.article>
                    ))}
                </div>
            </div>
        </section>
    );
}
