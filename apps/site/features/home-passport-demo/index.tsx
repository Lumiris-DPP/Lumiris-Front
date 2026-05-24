'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Leaf, Factory, ShieldCheck, ScanLine } from 'lucide-react';

const FEATURES = [
    {
        icon: Leaf,
        title: 'Composition détaillée',
        description: "Matières premières, origine, certifications. Tout ce qui compose la pièce, sans zone d'ombre.",
    },
    {
        icon: Factory,
        title: 'Parcours de fabrication',
        description: 'Chaque étape de production documentée : filature, tissage, confection, finition.',
    },
    {
        icon: ShieldCheck,
        title: 'Score Iris vérifié',
        description: 'Un score environnemental calculé sur 4 piliers publics, auditable et non achetable.',
    },
];

interface AxisRow {
    label: string;
    value: number;
    bar: string;
    text: string;
}

const AXES: readonly AxisRow[] = [
    { label: 'Transparence', value: 85, bar: 'bg-lumiris-emerald', text: 'text-lumiris-emerald' },
    { label: 'Savoir-faire', value: 78, bar: 'bg-lumiris-cyan', text: 'text-lumiris-cyan' },
    { label: 'Impact', value: 92, bar: 'bg-lumiris-amber', text: 'text-lumiris-amber' },
    { label: 'Réparabilité', value: 88, bar: 'bg-lumiris-iris', text: 'text-lumiris-iris' },
];

const TOTAL = 86; // moyenne pondérée 40/25/25/10

export function HomePassportDemo() {
    return (
        <section className="bg-muted/30 relative overflow-hidden py-24 sm:py-32">
            <div className="relative mx-auto max-w-6xl px-6">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                    {/* === Phone mockup === */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className="relative flex justify-center"
                    >
                        <div className="relative">
                            {/* Glow halo brand (cyan -> iris -> rose triade) */}
                            <div
                                aria-hidden
                                className="pointer-events-none absolute -inset-12 -z-10 rounded-[3.5rem] opacity-70 blur-3xl"
                                style={{
                                    background:
                                        'radial-gradient(ellipse at top, var(--lumiris-cyan) 0%, transparent 50%), radial-gradient(ellipse at bottom right, var(--lumiris-iris) 0%, transparent 50%), radial-gradient(ellipse at bottom left, var(--lumiris-rose) 0%, transparent 55%)',
                                    opacity: 0.12,
                                }}
                            />

                            {/* Floating Iris pastille au-dessus (signature) */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.6, y: -10 }}
                                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                className="absolute -right-6 -top-6 z-20 sm:-right-8"
                            >
                                <div className="bg-lumiris-emerald shadow-lumiris-emerald/40 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-black text-white shadow-2xl sm:h-20 sm:w-20 sm:text-4xl">
                                    A
                                </div>
                            </motion.div>

                            {/* Phone frame */}
                            <div className="bg-foreground relative w-72 rounded-[2.75rem] p-2.5 shadow-2xl sm:w-80">
                                <div className="bg-background overflow-hidden rounded-[2.25rem]">
                                    {/* Status bar (notch) */}
                                    <div className="bg-card flex items-center justify-center py-2">
                                        <div className="bg-foreground h-6 w-28 rounded-full" />
                                    </div>

                                    {/* Hero image grand format */}
                                    <div className="relative h-44 w-full overflow-hidden">
                                        <Image
                                            src="/images/product-chemise.jpg"
                                            alt="Chemise en lin Atelier Margaux"
                                            fill
                                            sizes="320px"
                                            className="object-cover"
                                        />
                                        {/* Overlay gradient pour la lisibilité du titre superposé */}
                                        <div className="bg-linear-to-t absolute inset-0 from-black/60 via-black/10 to-transparent" />
                                        {/* Titre + atelier en bas image */}
                                        <div className="absolute bottom-3 left-4 right-4 text-white">
                                            <p className="text-[10px] font-medium uppercase tracking-wider opacity-80">
                                                Atelier Margaux · Roanne
                                            </p>
                                            <p className="text-base font-semibold leading-tight">Chemise Lin</p>
                                        </div>
                                    </div>

                                    <div className="px-5 pb-5 pt-4">
                                        {/* Score total en hero */}
                                        <div className="border-border/60 flex items-baseline gap-3 border-b pb-4">
                                            <span className="text-foreground text-4xl font-black tabular-nums">
                                                {TOTAL}
                                            </span>
                                            <span className="text-muted-foreground font-mono text-xs">/ 100</span>
                                            <span className="text-lumiris-emerald ml-auto text-xs font-semibold uppercase tracking-wider">
                                                Score Iris
                                            </span>
                                        </div>

                                        {/* Composition chips */}
                                        <div className="mt-4">
                                            <p className="text-muted-foreground mb-2 font-mono text-[10px] uppercase tracking-wider">
                                                Composition
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                <span className="bg-muted text-foreground rounded-full px-2.5 py-1 text-[11px] font-medium">
                                                    Lin 100%
                                                </span>
                                                <span className="bg-muted text-foreground rounded-full px-2.5 py-1 text-[11px] font-medium">
                                                    Origine France
                                                </span>
                                                <span className="bg-lumiris-emerald/10 text-lumiris-emerald rounded-full px-2.5 py-1 text-[11px] font-medium">
                                                    GOTS ✓
                                                </span>
                                            </div>
                                        </div>

                                        {/* 4 piliers — barres + valeurs colorées */}
                                        <div className="mt-4">
                                            <p className="text-muted-foreground mb-2 font-mono text-[10px] uppercase tracking-wider">
                                                4 piliers Iris
                                            </p>
                                            <div className="space-y-2.5">
                                                {AXES.map((axis) => (
                                                    <div key={axis.label} className="flex items-center gap-2">
                                                        <span className="text-muted-foreground w-17 text-[10px]">
                                                            {axis.label}
                                                        </span>
                                                        <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                whileInView={{ width: `${axis.value}%` }}
                                                                viewport={{ once: true, margin: '-100px' }}
                                                                transition={{
                                                                    duration: 1,
                                                                    delay: 0.5,
                                                                    ease: [0.16, 1, 0.3, 1],
                                                                }}
                                                                className={`h-full rounded-full ${axis.bar}`}
                                                            />
                                                        </div>
                                                        <span
                                                            className={`w-7 text-right font-mono text-[10px] font-semibold tabular-nums ${axis.text}`}
                                                        >
                                                            {axis.value}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* "Scanné via VISION" floating pill en bas */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.6 }}
                                className="bg-foreground absolute -bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-white shadow-2xl"
                            >
                                <ScanLine className="text-lumiris-cyan h-4 w-4" aria-hidden />
                                <span className="text-xs font-medium">Scanné via VISION</span>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* === Features list === */}
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ duration: 0.5 }}
                        >
                            <p className="text-muted-foreground mb-3 font-mono text-xs uppercase tracking-[0.25em]">
                                Le passeport
                            </p>
                            <h2 className="text-foreground text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                                Un passeport complet pour chaque pièce
                            </h2>
                            <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
                                Scannez le QR code ou la puce NFC pour accéder instantanément à la traçabilité complète
                                : composition, fabrication, atelier, score.
                            </p>
                        </motion.div>

                        <ul className="mt-10 space-y-5">
                            {FEATURES.map((feature, i) => (
                                <motion.li
                                    key={feature.title}
                                    initial={{ opacity: 0, x: 16 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: '-50px' }}
                                    transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                                    className="flex gap-4"
                                >
                                    <div className="bg-lumiris-cyan/10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                                        <feature.icon className="text-lumiris-cyan h-5 w-5" aria-hidden />
                                    </div>
                                    <div>
                                        <h3 className="text-foreground font-semibold">{feature.title}</h3>
                                        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>
                                </motion.li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
