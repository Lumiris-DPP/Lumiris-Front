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
    { label: 'Transparence', value: 85, bar: 'bg-lumiris-cyan', text: 'text-lumiris-cyan' },
    { label: 'Savoir-faire', value: 78, bar: 'bg-lumiris-cyan', text: 'text-lumiris-cyan' },
    { label: 'Impact', value: 92, bar: 'bg-lumiris-amber', text: 'text-lumiris-amber' },
    { label: 'Réparabilité', value: 88, bar: 'bg-lumiris-iris', text: 'text-lumiris-iris' },
];

const TOTAL = 86; // moyenne pondérée 40/25/25/10

export function HomePassportDemo() {
    return (
        <section className="relative overflow-hidden bg-muted/30 py-24 sm:py-32">
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
                                className="absolute -top-6 -right-6 z-20 sm:-right-8"
                            >
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-lumiris-emerald text-3xl font-black text-white shadow-2xl shadow-lumiris-emerald/40 sm:h-20 sm:w-20 sm:text-4xl">
                                    A
                                </div>
                            </motion.div>

                            {/* Phone frame */}
                            <div className="relative w-72 rounded-[2.75rem] bg-foreground p-2.5 shadow-2xl sm:w-80">
                                <div className="overflow-hidden rounded-[2.25rem] bg-background">
                                    {/* Status bar (notch) */}
                                    <div className="flex items-center justify-center bg-card py-2">
                                        <div className="h-6 w-28 rounded-full bg-foreground" />
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
                                        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
                                        {/* Titre + atelier en bas image */}
                                        <div className="absolute right-4 bottom-3 left-4 text-white">
                                            <p className="text-[10px] font-medium tracking-wider uppercase opacity-80">
                                                Atelier Margaux · Roanne
                                            </p>
                                            <p className="text-base leading-tight font-semibold">Chemise Lin</p>
                                        </div>
                                    </div>

                                    <div className="px-5 pt-4 pb-5">
                                        {/* Score total en hero */}
                                        <div className="flex items-baseline gap-3 border-b border-border/60 pb-4">
                                            <span className="text-4xl font-black text-foreground tabular-nums">
                                                {TOTAL}
                                            </span>
                                            <span className="font-mono text-xs text-muted-foreground">/ 100</span>
                                            <span className="ml-auto text-xs font-semibold tracking-wider text-lumiris-cyan uppercase">
                                                Score Iris
                                            </span>
                                        </div>

                                        {/* Composition chips */}
                                        <div className="mt-4">
                                            <p className="mb-2 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                                                Composition
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground">
                                                    Lin 100%
                                                </span>
                                                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground">
                                                    Origine France
                                                </span>
                                                <span className="rounded-full bg-lumiris-emerald/10 px-2.5 py-1 text-[11px] font-medium text-lumiris-emerald">
                                                    GOTS ✓
                                                </span>
                                            </div>
                                        </div>

                                        {/* 4 piliers — barres + valeurs colorées */}
                                        <div className="mt-4">
                                            <p className="mb-2 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                                                4 piliers Iris
                                            </p>
                                            <div className="space-y-2.5">
                                                {AXES.map((axis) => (
                                                    <div key={axis.label} className="flex items-center gap-2">
                                                        <span className="w-17 text-[10px] text-muted-foreground">
                                                            {axis.label}
                                                        </span>
                                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
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
                                className="absolute -bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-4 py-2 text-white shadow-2xl"
                            >
                                <ScanLine className="h-4 w-4 text-lumiris-cyan" aria-hidden />
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
                            <p className="mb-3 font-mono text-xs tracking-[0.25em] text-muted-foreground uppercase">
                                Le passeport
                            </p>
                            <h2 className="text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl">
                                Un passeport complet pour chaque pièce
                            </h2>
                            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
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
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lumiris-cyan/10">
                                        <feature.icon className="h-5 w-5 text-lumiris-cyan" aria-hidden />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground">{feature.title}</h3>
                                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
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
