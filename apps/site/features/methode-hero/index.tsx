'use client';

import { motion } from 'framer-motion';
import { Scale } from 'lucide-react';

export function MethodeHero() {
    return (
        <section className="relative overflow-hidden pt-32 pb-16">
            {/* Subtle gradient */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute top-1/4 left-1/3 h-80 w-80 rounded-full bg-lumiris-cyan/5 blur-3xl" />
                <div className="absolute right-1/3 bottom-1/4 h-80 w-80 rounded-full bg-lumiris-cyan/5 blur-3xl" />
            </div>

            <div className="mx-auto max-w-4xl px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                        <Scale className="h-3.5 w-3.5 text-lumiris-cyan" aria-hidden="true" />
                        Open source · Auditable
                    </span>
                    <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
                        La méthodologie Iris
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                        Un score environnemental transparent, calculé sur 4 piliers pondérés, non achetable et auditable
                        par tous. Algorithme open source, datasets publics.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
