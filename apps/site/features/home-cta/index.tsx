'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function HomeCta() {
    return (
        <section className="relative overflow-hidden py-24 sm:py-32">
            {/* Prismatic halo background */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="from-cyan-500/6 via-violet-500/4 to-pink-500/6 absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br blur-3xl" />
            </div>

            <div className="mx-auto max-w-4xl px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-foreground text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                        Rejoignez le mouvement de la transparence textile
                    </h2>
                    <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg">
                        Que vous soyez artisan ou consommateur, LUMIRIS vous donne les clés pour comprendre et valoriser
                        le textile responsable.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="mt-10 flex flex-wrap items-center justify-center gap-4"
                >
                    <Link
                        href="/decouvrir"
                        className="bg-foreground text-background inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
                    >
                        Découvrir les pièces
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                        href="/atelier"
                        className="border-border text-foreground hover:bg-muted/50 inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-medium transition-colors"
                    >
                        Espace artisans
                    </Link>
                    <Link
                        href="/vision"
                        className="border-border text-foreground hover:bg-muted/50 inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-medium transition-colors"
                    >
                        Télécharger VISION
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
