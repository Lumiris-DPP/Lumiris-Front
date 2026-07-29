'use client';

import { motion } from 'framer-motion';
import { Shield, Server, Eye } from 'lucide-react';

const PRIVACY_POINTS = [
    {
        icon: Shield,
        title: 'Données chiffrées',
        description: 'Toutes vos données sont chiffrées en transit et au repos (AES-256).',
    },
    {
        icon: Server,
        title: 'Hébergement français',
        description: 'Serveurs en France (Scaleway, OVH), conformes RGPD.',
    },
    {
        icon: Eye,
        title: 'Aucune revente',
        description: 'Vos données ne sont jamais vendues ni partagées avec des tiers.',
    },
];

export function VisionPrivacy() {
    return (
        <section className="bg-lumiris-cyan/5 py-20 sm:py-28">
            <div className="mx-auto max-w-6xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5 }}
                    className="mb-10 text-center"
                >
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Votre vie privée, notre priorité
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                        VISION est conçu avec la confidentialité au coeur de son architecture.
                    </p>
                </motion.div>

                <div className="grid gap-6 sm:grid-cols-3">
                    {PRIVACY_POINTS.map((point, index) => (
                        <motion.div
                            key={point.title}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                            <div className="rounded-xl border border-border bg-card p-5 text-center">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-lumiris-cyan/10">
                                    <point.icon className="h-6 w-6 text-lumiris-cyan" />
                                </div>
                                <h3 className="font-semibold text-foreground">{point.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                    {point.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
