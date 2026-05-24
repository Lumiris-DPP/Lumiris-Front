'use client';

import { motion } from 'framer-motion';
import { ScanLine, Shield, Shirt } from 'lucide-react';

type PromiseTone = 'iris' | 'cyan' | 'rose';

const TONE_CLASSES: Record<PromiseTone, { bg: string; text: string }> = {
    iris: { bg: 'bg-lumiris-iris/10', text: 'text-lumiris-iris' },
    cyan: { bg: 'bg-lumiris-cyan/10', text: 'text-lumiris-cyan' },
    rose: { bg: 'bg-lumiris-rose/10', text: 'text-lumiris-rose' },
};

const PROMISES: ReadonlyArray<{
    icon: typeof ScanLine;
    title: string;
    description: string;
    tone: PromiseTone;
}> = [
    {
        icon: ScanLine,
        title: 'Scan universel',
        description: 'QR code, NFC, code-barres — VISION décode tous les formats DPP européens en une seconde.',
        tone: 'iris',
    },
    {
        icon: Shield,
        title: 'Score Iris',
        description: 'Composition, fabrication, durabilité, social : 4 piliers pour un score transparent et impartial.',
        tone: 'cyan',
    },
    {
        icon: Shirt,
        title: 'Garde-Robe',
        description: "Enregistrez vos pièces, suivez leur histoire, recevez des conseils d'entretien personnalisés.",
        tone: 'rose',
    },
];

export function VisionPromises() {
    return (
        <section className="py-20 sm:py-28">
            <div className="mx-auto max-w-6xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5 }}
                    className="mb-12 text-center"
                >
                    <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
                        Trois promesses, une app
                    </h2>
                    <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
                        Tout ce dont vous avez besoin pour consommer le textile en conscience.
                    </p>
                </motion.div>

                <div className="grid gap-6 sm:grid-cols-3">
                    {PROMISES.map((promise, index) => {
                        const tone = TONE_CLASSES[promise.tone];

                        return (
                            <motion.div
                                key={promise.title}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-50px' }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                            >
                                <div className="bg-card border-border h-full rounded-2xl border p-6 text-center">
                                    <div
                                        className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${tone.bg}`}
                                    >
                                        <promise.icon className={`h-7 w-7 ${tone.text}`} />
                                    </div>
                                    <h3 className="text-foreground text-lg font-semibold">{promise.title}</h3>
                                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                                        {promise.description}
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
