'use client';

import { motion } from 'framer-motion';

export function VisionCta() {
    return (
        <section className="relative overflow-hidden py-20 sm:py-28">
            {/* Prismatic halo */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="from-violet-500/6 via-cyan-500/4 to-pink-500/6 absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br blur-3xl" />
            </div>

            <div className="mx-auto max-w-4xl px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                        Téléchargez VISION gratuitement
                    </h2>
                    <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg">
                        Disponible sur iOS et Android. Scannez votre premier DPP en 10 secondes.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="mt-10 flex flex-wrap items-center justify-center gap-4"
                >
                    {/* App Store badge — URL store à brancher quand l'app est publiée */}
                    <button
                        type="button"
                        disabled
                        className="bg-foreground text-background inline-flex items-center gap-3 rounded-xl px-5 py-3 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Télécharger sur l'App Store — bientôt disponible"
                    >
                        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                        </svg>
                        <div className="text-left">
                            <p className="text-xs opacity-80">Bientôt sur</p>
                            <p className="text-sm font-semibold">App Store</p>
                        </div>
                    </button>

                    {/* Google Play badge — URL store à brancher quand l'app est publiée */}
                    <button
                        type="button"
                        disabled
                        className="bg-foreground text-background inline-flex items-center gap-3 rounded-xl px-5 py-3 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Télécharger sur Google Play — bientôt disponible"
                    >
                        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <path d="M3 20.5v-17c0-.83.67-1.5 1.5-1.5.32 0 .62.1.88.27l14.12 8.5c.52.32.52 1.14 0 1.46l-14.12 8.5c-.26.17-.56.27-.88.27-.83 0-1.5-.67-1.5-1.5z" />
                        </svg>
                        <div className="text-left">
                            <p className="text-xs opacity-80">Bientôt sur</p>
                            <p className="text-sm font-semibold">Google Play</p>
                        </div>
                    </button>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="text-muted-foreground mt-6 text-sm"
                >
                    Gratuit · Sans publicité · Sans engagement
                </motion.p>
            </div>
        </section>
    );
}
