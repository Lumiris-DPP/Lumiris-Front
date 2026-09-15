'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Download } from 'lucide-react';

export function VisionCta() {
    return (
        <section className="relative overflow-hidden py-20 sm:py-28">
            {/* Prismatic halo */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-lumiris-iris/6 via-lumiris-cyan/4 to-lumiris-rose/6 blur-3xl" />
            </div>

            <div className="mx-auto max-w-4xl px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                        Téléchargez VISION gratuitement
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                        Disponible sur Android ou depuis n&apos;importe quel navigateur. Scannez votre premier DPP en 10
                        secondes.
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
                        href="/telecharger"
                        className="inline-flex items-center gap-3 rounded-xl bg-foreground px-6 py-3.5 text-background transition-opacity hover:opacity-90"
                    >
                        <Download className="h-5 w-5" aria-hidden />
                        <span className="text-sm font-semibold">Installer VISION (Android)</span>
                    </Link>

                    <a
                        href="https://mobile.lumiris.eu"
                        className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                    >
                        ou ouvrir dans le navigateur
                    </a>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="mt-6 text-sm text-muted-foreground"
                >
                    Gratuit · Sans publicité · Sans engagement
                </motion.p>
            </div>
        </section>
    );
}
