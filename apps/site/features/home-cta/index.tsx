'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function HomeCta() {
    return (
        <section className="relative overflow-hidden py-24 sm:py-32">
            {/* Prismatic halo background */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-lumiris-cyan/6 via-lumiris-iris/4 to-lumiris-rose/6 blur-3xl" />
            </div>

            <div className="mx-auto max-w-4xl px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl lg:text-5xl">
                        Rejoignez le mouvement de la transparence textile
                    </h2>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
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
                        className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
                    >
                        Découvrir les pièces
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                        href="/atelier"
                        className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                    >
                        Espace artisans
                    </Link>
                    <Link
                        href="/vision"
                        className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                    >
                        Télécharger VISION
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
