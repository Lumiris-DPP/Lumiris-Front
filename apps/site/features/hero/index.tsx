'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Scan } from 'lucide-react';
import Link from 'next/link';

export function Hero() {
    return (
        <section className="relative isolate overflow-hidden">
            <div
                aria-hidden="true"
                className="prismatic-bg h-120 pointer-events-none absolute inset-x-0 top-0 -z-10 opacity-[0.07] blur-3xl"
            />
            <motion.div
                className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-6 pb-24 pt-32 text-center"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            >
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.25em]">
                    LUMIRIS · Le passeport numérique de la consommation
                </p>
                <h1 className="text-foreground max-w-4xl text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
                    Un scan, une histoire, un score Iris.
                </h1>
                <p className="text-muted-foreground max-w-2xl text-balance text-base leading-relaxed sm:text-lg">
                    LUMIRIS aide les artisans textile français à créer le passeport numérique de leurs pièces, et permet
                    à tout client de scanner n’importe quel DPP européen — textile, tech, électroménager, mobilier — en
                    un geste.
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                    <Link
                        href="/artisans"
                        className="bg-foreground text-background inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
                    >
                        <Scan className="h-3.5 w-3.5" aria-hidden="true" />
                        Scanner une pièce
                    </Link>
                    <Link
                        href="/atelier"
                        className="border-border text-foreground hover:bg-secondary inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors"
                    >
                        Je suis artisan
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                </div>
                <p className="text-muted-foreground/70 mt-4 text-xs">
                    Aucun acteur ne peut payer pour modifier son score Iris.
                </p>
            </motion.div>
        </section>
    );
}
