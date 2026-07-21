'use client';

import { motion } from 'framer-motion';
import { UserPlus, ScanLine, Layers, QrCode } from 'lucide-react';

interface Step {
    icon: typeof UserPlus;
    step: string;
    title: string;
    description: string;
    iconBg: string;
    iconText: string;
    accentText: string;
}

const STEPS: readonly Step[] = [
    {
        icon: UserPlus,
        step: '01',
        title: 'Inscription',
        description: 'Créez votre compte ATELIER en 2 minutes avec votre email et SIRET.',
        iconBg: 'bg-lumiris-cyan/10',
        iconText: 'text-lumiris-cyan',
        accentText: 'text-lumiris-cyan',
    },
    {
        icon: ScanLine,
        step: '02',
        title: 'Scan OCR',
        description: "Photographiez vos factures, l'OCR pré-remplit composition et traçabilité.",
        iconBg: 'bg-lumiris-iris/10',
        iconText: 'text-lumiris-iris',
        accentText: 'text-lumiris-iris',
    },
    {
        icon: Layers,
        step: '03',
        title: 'Fabrication',
        description: 'Documentez filature, tissage, confection. Ajoutez vos certifications.',
        iconBg: 'bg-lumiris-cyan/10',
        iconText: 'text-lumiris-cyan',
        accentText: 'text-lumiris-cyan',
    },
    {
        icon: QrCode,
        step: '04',
        title: 'Publication',
        description: 'Générez QR code et puce NFC GS1. Score Iris calculé automatiquement.',
        iconBg: 'bg-lumiris-rose/10',
        iconText: 'text-lumiris-rose',
        accentText: 'text-lumiris-rose',
    },
];

export function AtelierSteps() {
    return (
        <section className="bg-muted/30 py-20 sm:py-28">
            <div className="mx-auto max-w-6xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5 }}
                    className="mb-14 text-center"
                >
                    <span className="bg-foreground/5 text-muted-foreground inline-block rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider">
                        Comment ça marche
                    </span>
                    <h2 className="text-foreground mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                        4 étapes, 30 minutes
                    </h2>
                    <p className="text-muted-foreground mx-auto mt-3 max-w-lg text-lg">
                        De l&apos;inscription à la publication de votre premier passeport.
                    </p>
                </motion.div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {STEPS.map((step, index) => (
                        <motion.article
                            key={step.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                            className="bg-card border-border group relative flex h-full flex-col overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                        >
                            {/* Numéro géant filigrane en arrière-plan, intégré dans la card */}
                            <span
                                aria-hidden
                                className={`pointer-events-none absolute -right-2 -top-4 select-none font-mono text-[7rem] font-black leading-none opacity-[0.06] transition-opacity duration-300 group-hover:opacity-[0.12] ${step.accentText}`}
                            >
                                {step.step}
                            </span>

                            {/* Icon */}
                            <div
                                className={`relative flex h-14 w-14 items-center justify-center rounded-2xl ${step.iconBg}`}
                            >
                                <step.icon className={`h-7 w-7 ${step.iconText}`} aria-hidden />
                            </div>

                            {/* Title + description */}
                            <h3 className="text-foreground relative mt-5 text-lg font-semibold">{step.title}</h3>
                            <p className="text-muted-foreground relative mt-2 flex-1 text-sm leading-relaxed">
                                {step.description}
                            </p>
                        </motion.article>
                    ))}
                </div>
            </div>
        </section>
    );
}
