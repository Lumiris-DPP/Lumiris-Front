'use client';

import { motion } from 'framer-motion';
import { CalendarRange } from 'lucide-react';

interface TimelineEntry {
    date: string;
    label: string;
    region: 'France' | 'UE';
    description: string;
}

const ENTRIES: readonly TimelineEntry[] = [
    {
        date: 'Février 2020',
        label: 'AGEC promulguée',
        region: 'France',
        description:
            'Loi anti-gaspillage : socle français de l’étiquetage environnemental textile et du bonus réparation.',
    },
    {
        date: 'Juillet 2024',
        label: 'ESPR en vigueur',
        region: 'UE',
        description:
            'Le règlement européen ESPR entre en vigueur. Programme de travail 2025-2030 : textile prioritaire, puis tech, batteries, électroménager, meubles.',
    },
    {
        date: '19 juillet 2026',
        label: 'Registre central DPP',
        region: 'UE',
        description:
            'Ouverture du registre central des Digital Product Passports. URL canonique unique pour chaque passeport européen, tous secteurs confondus.',
    },
    {
        date: '2027',
        label: 'Acte délégué textile',
        region: 'UE',
        description:
            'Adoption de l’acte délégué qui définit les exigences DPP précises pour le textile (catégories, seuils, formats). Premières vagues élec et batteries la même année.',
    },
    {
        date: 'Mi-2028 → 2029',
        label: 'DPP textile obligatoire',
        region: 'UE',
        description:
            'Application pleine et entière du DPP textile, 18 mois après l’adoption. TPE et micro-entreprises incluses : tout vêtement vendu en UE doit l’exposer.',
    },
    {
        date: '2028 → 2030',
        label: 'Vagues suivantes',
        region: 'UE',
        description:
            'Actes délégués pour l’électronique, l’électroménager, le mobilier, les jouets. Extension méthodique de la plateforme ATELIER au rythme du calendrier ESPR.',
    },
];

const REGION_TONE: Record<TimelineEntry['region'], string> = {
    France: 'bg-grade-a/8 text-grade-a border-grade-a/20',
    UE: 'bg-grade-b/8 text-grade-b border-grade-b/20',
};

export function RegulatoryTimeline() {
    return (
        <section className="bg-secondary/40 border-border border-y py-20" aria-labelledby="timeline-title">
            <div className="mx-auto max-w-6xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mb-12 max-w-2xl"
                >
                    <p className="text-muted-foreground mb-3 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.25em]">
                        <CalendarRange className="h-3.5 w-3.5" />
                        Calendrier réglementaire
                    </p>
                    <h2 id="timeline-title" className="text-foreground text-balance text-3xl font-bold sm:text-4xl">
                        AGEC, ESPR, DPP : la fenêtre 2026-2030
                    </h2>
                    <p className="text-muted-foreground mt-3 leading-relaxed">
                        Le textile ouvre la marche, puis l’ESPR couvre tech, batteries, électroménager et mobilier. Une
                        fenêtre de 24 à 30 mois pour s’imposer sur le textile avant que les vagues suivantes
                        n’élargissent le marché.
                    </p>
                </motion.div>

                <ol className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 [scrollbar-width:thin]">
                    {ENTRIES.map((entry, i) => (
                        <motion.li
                            key={entry.label}
                            initial={{ opacity: 0, y: 18 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ duration: 0.4, delay: i * 0.06 }}
                            className="bg-card border-border w-72 shrink-0 snap-start rounded-2xl border p-5 shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-muted-foreground font-mono text-[11px]">{entry.date}</p>
                                <span
                                    className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${REGION_TONE[entry.region]}`}
                                >
                                    {entry.region}
                                </span>
                            </div>
                            <h3 className="text-foreground mt-3 text-base font-semibold leading-snug">{entry.label}</h3>
                            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{entry.description}</p>
                        </motion.li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
