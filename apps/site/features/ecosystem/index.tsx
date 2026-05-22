'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Hammer, Scan, Shirt, Receipt, ShieldCheck, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Surface {
    id: string;
    eyebrow: string;
    title: string;
    audience: string;
    description: string;
    bullets: ReadonlyArray<{ icon: LucideIcon; label: string }>;
    cta: { label: string; href: string };
    iconTint: string;
}

const SURFACES: readonly Surface[] = [
    {
        id: 'atelier',
        eyebrow: 'ATELIER · B2B',
        title: 'L’outil des artisans',
        audience: 'TPE et PME textile, étendu progressivement aux autres secteurs ESPR.',
        description:
            'Création des passeports DPP en parcours guidé : composition, fournisseurs, étapes, certifications, QR/NFC. OCR sur les factures pour pré-remplir.',
        bullets: [
            { icon: Hammer, label: 'Création guidée en 6 étapes' },
            { icon: ShieldCheck, label: 'Conforme ESPR + AGEC anticipée' },
        ],
        cta: { label: 'Découvrir l’offre ATELIER', href: '/atelier' },
        iconTint: 'text-grade-a',
    },
    {
        id: 'vision',
        eyebrow: 'VISION · B2C scanner universel',
        title: 'L’app client multi-secteurs',
        audience: 'Tout le monde. Gratuit, sans compte requis pour le scan.',
        description:
            'Lit tous les DPP européens : textile artisanal LUMIRIS, smartphone, électroménager, mobilier, batteries. Effet de prisme au moment du scan.',
        bullets: [
            { icon: Scan, label: 'Compatible GS1 Digital Link + ESPR' },
            { icon: Shirt, label: 'Marketplace artisans curatée' },
        ],
        cta: { label: 'Parcourir les passeports', href: '/artisans' },
        iconTint: 'text-grade-b',
    },
    {
        id: 'garde-robe',
        eyebrow: 'GARDE-ROBE · inventaire global',
        title: 'Tous vos achats, un seul coffre',
        audience: 'Utilisateurs avec compte gratuit. Données chiffrées, propriété 100% utilisateur.',
        description:
            'Inventaire global de consommation : vêtements, smartphones, électroménager, mobilier. Surcouche documentaire pour archiver factures, garanties, assurances, tickets de réparation.',
        bullets: [
            { icon: Receipt, label: 'Factures, garanties, contrats d’assurance' },
            { icon: Wrench, label: 'Retoucheurs et réparateurs locaux' },
        ],
        cta: { label: 'Voir la charte d’indépendance', href: '/charte-independance' },
        iconTint: 'text-grade-c',
    },
];

export function Ecosystem() {
    return (
        <section className="py-24" aria-labelledby="ecosystem-title">
            <div className="mx-auto max-w-6xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mb-14 max-w-2xl"
                >
                    <p className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-[0.25em]">
                        L’écosystème
                    </p>
                    <h2 id="ecosystem-title" className="text-foreground text-balance text-3xl font-bold sm:text-4xl">
                        Trois surfaces, une infrastructure DPP
                    </h2>
                    <p className="text-muted-foreground mt-3 leading-relaxed">
                        ATELIER pour créer le passeport, VISION pour le lire — qu’il vienne du textile français ou de
                        n’importe quel produit ESPR — et la Garde-Robe pour centraliser tout ce que le client possède.
                    </p>
                </motion.div>

                <ul className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    {SURFACES.map((s, i) => (
                        <motion.li
                            key={s.id}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ duration: 0.5, delay: i * 0.08 }}
                            className="bg-card border-border flex flex-col rounded-2xl border p-6 shadow-sm"
                        >
                            <p className={`font-mono text-[10px] font-semibold uppercase tracking-wider ${s.iconTint}`}>
                                {s.eyebrow}
                            </p>
                            <h3 className="text-foreground mt-3 text-lg font-semibold leading-snug">{s.title}</h3>
                            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{s.audience}</p>
                            <p className="text-foreground/85 mt-4 text-sm leading-relaxed">{s.description}</p>
                            <ul className="border-border mt-5 flex-1 space-y-2 border-t pt-4">
                                {s.bullets.map(({ icon: Icon, label }) => (
                                    <li
                                        key={label}
                                        className="text-muted-foreground flex items-start gap-2 text-xs leading-relaxed"
                                    >
                                        <Icon
                                            className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${s.iconTint}`}
                                            aria-hidden="true"
                                        />
                                        <span>{label}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link
                                href={s.cta.href}
                                className="text-foreground hover:text-grade-a mt-5 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
                            >
                                {s.cta.label}
                                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </Link>
                        </motion.li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
