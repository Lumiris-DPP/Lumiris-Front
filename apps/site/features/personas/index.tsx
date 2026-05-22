'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Quote } from 'lucide-react';

interface Persona {
    id: string;
    name: string;
    role: string;
    photo: string;
    quote: string;
    solution: string;
}

const PERSONAS: readonly Persona[] = [
    {
        id: 'marie',
        name: 'Marie, 34 ans · créatrice',
        role: 'Couturière en Bretagne, atelier de 2 personnes (lin local)',
        photo: 'https://placehold.co/256x256/0ea5b7/ffffff/png?text=Marie',
        quote: '« Mes clients me redemandent sans arrêt d’où vient mon lin. Aujourd’hui je scanne mes factures fournisseur et le passeport est prêt en quelques minutes. »',
        solution:
            'ATELIER Solo à 290 €/an. Création de passeports avec OCR des factures, QR sur l’étiquette, conformité ESPR anticipée.',
    },
    {
        id: 'theo',
        name: 'Théo, 29 ans · fondateur DNVB',
        role: 'Marque de chaussures cuir à Romans-sur-Isère, studio de 4',
        photo: 'https://placehold.co/256x256/f97316/ffffff/png?text=Theo',
        quote: '« Mes concurrents disent tous “made in France” sans le prouver. Je veux que chaque paire raconte son histoire elle-même. »',
        solution:
            'ATELIER Studio à 790 €/an + ATELIER+ à 190 €/an. Passeports visibles dans VISION, mise en avant prioritaire face au fast-fashion.',
    },
    {
        id: 'lea',
        name: 'Léa, 32 ans · acheteuse engagée',
        role: 'CSP+ urbaine, budget vêtement 1 500 €/an',
        photo: 'https://placehold.co/256x256/059669/ffffff/png?text=Lea',
        quote: '« Yuka me dit ce que je mange. Je veux la même chose pour ce que je porte, ce que j’installe chez moi, ce que je branche dans mon salon. »',
        solution:
            'VISION gratuit : scan universel de tous les DPP européens (textile, tech, électroménager, mobilier). Garde-Robe globale qui archive factures et garanties.',
    },
    {
        id: 'mehdi',
        name: 'Mehdi, 45 ans · retoucheur',
        role: 'Atelier en pied d’immeuble à Lyon, CA 55 k€',
        photo: 'https://placehold.co/256x256/dc2626/ffffff/png?text=Mehdi',
        quote: '« 70% de mes clients viennent du bouche-à-oreille. Les plateformes existantes prennent 25 à 40% — c’est intenable. »',
        solution:
            'LUMIRIS Local à 190 €/an. Profil enrichi, remontée prioritaire dans les recherches locales, commission de mise en relation raisonnable.',
    },
];

export function Personas() {
    return (
        <section className="py-24" aria-labelledby="personas-title">
            <div className="mx-auto max-w-6xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mb-14 max-w-2xl"
                >
                    <p className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-[0.25em]">
                        Quatre points de vue
                    </p>
                    <h2 id="personas-title" className="text-foreground text-balance text-3xl font-bold sm:text-4xl">
                        Une plateforme, quatre rôles
                    </h2>
                    <p className="text-muted-foreground mt-3 leading-relaxed">
                        LUMIRIS sert les artisans textile, les DNVB en croissance, les acheteurs qui veulent la preuve,
                        et le réseau de retoucheurs qui font durer les pièces.
                    </p>
                </motion.div>

                <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {PERSONAS.map((p, i) => (
                        <motion.li
                            key={p.id}
                            initial={{ opacity: 0, y: 18 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ duration: 0.5, delay: i * 0.07 }}
                            className="bg-card border-border flex flex-col gap-4 rounded-2xl border p-6 shadow-sm sm:flex-row sm:gap-6"
                        >
                            <Image
                                src={p.photo}
                                alt={`Photo de ${p.name}`}
                                width={88}
                                height={88}
                                className="border-border h-22 w-22 shrink-0 rounded-2xl border object-cover"
                            />
                            <div className="flex-1">
                                <p className="text-foreground text-base font-semibold">{p.name}</p>
                                <p className="text-muted-foreground text-xs">{p.role}</p>
                                <p className="text-foreground/90 mt-3 text-sm leading-relaxed">
                                    <Quote className="text-muted-foreground/50 mr-1 inline h-3.5 w-3.5" />
                                    {p.quote}
                                </p>
                                <p className="text-muted-foreground border-border mt-4 border-t pt-3 text-xs leading-relaxed">
                                    <span className="text-foreground font-semibold">Solution LUMIRIS — </span>
                                    {p.solution}
                                </p>
                            </div>
                        </motion.li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
