'use client';

import { motion } from 'framer-motion';

const stats = [
    { value: '12', label: 'ateliers EPV partenaires' },
    { value: '184', label: 'passeports publiés' },
    { value: '0', label: 'score acheté' },
    { value: '100%', label: 'méthode publique' },
];

export function HomeStats() {
    return (
        <section className="py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 sm:gap-x-8"
                >
                    {stats.map((stat, index) => (
                        <div key={stat.label} className="flex items-center gap-2">
                            {index > 0 && (
                                <span className="mr-2 hidden text-2xl text-muted-foreground/30 sm:mr-4 sm:inline">
                                    ·
                                </span>
                            )}
                            <span className="font-mono text-2xl font-bold text-foreground sm:text-3xl">
                                {stat.value}
                            </span>
                            <span className="text-sm text-muted-foreground">{stat.label}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
