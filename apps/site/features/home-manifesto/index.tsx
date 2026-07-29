'use client';

import { motion } from 'framer-motion';

interface ManifestoEntry {
    text: string;
    highlight: string;
    accent: 'cyan' | 'iris' | 'rose';
}

const ACCENT_CLASSES: Record<ManifestoEntry['accent'], { num: string; line: string; dot: string }> = {
    cyan: {
        num: 'text-lumiris-cyan',
        line: 'from-lumiris-cyan/40 via-lumiris-cyan/10 to-transparent',
        dot: 'bg-lumiris-cyan',
    },
    iris: {
        num: 'text-lumiris-iris',
        line: 'from-lumiris-iris/40 via-lumiris-iris/10 to-transparent',
        dot: 'bg-lumiris-iris',
    },
    rose: {
        num: 'text-lumiris-rose',
        line: 'from-lumiris-rose/40 via-lumiris-rose/10 to-transparent',
        dot: 'bg-lumiris-rose',
    },
};

const MANIFESTO: readonly ManifestoEntry[] = [
    { text: 'Chaque vêtement a une histoire.', highlight: 'LUMIRIS la rend visible.', accent: 'cyan' },
    { text: "Un score qui ne s'achète pas,", highlight: 'une traçabilité qui ne se maquille pas.', accent: 'iris' },
    { text: "Du fil à l'armoire,", highlight: 'la transparence radicale devient la norme.', accent: 'rose' },
];

export function HomeManifesto() {
    return (
        <section className="relative overflow-hidden py-24 sm:py-32">
            {/* Background subtil — halos plus petits et plus discrets */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute top-[20%] left-[15%] h-44 w-44 rounded-full bg-lumiris-cyan/4 blur-3xl" />
                <div className="absolute top-1/2 right-[15%] h-44 w-44 -translate-y-1/2 rounded-full bg-lumiris-iris/4 blur-3xl" />
                <div className="absolute bottom-[20%] left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-lumiris-rose/4 blur-3xl" />
            </div>

            <div className="mx-auto max-w-4xl px-6">
                <ul className="flex flex-col gap-16 sm:gap-20">
                    {MANIFESTO.map((entry, index) => {
                        const accent = ACCENT_CLASSES[entry.accent];
                        const isLast = index === MANIFESTO.length - 1;
                        return (
                            <motion.li
                                key={entry.highlight}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                                className="relative"
                            >
                                {/* Numéro inline à gauche de la phrase, hauteur ≈ 2 lignes de texte */}
                                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-7">
                                    <span
                                        className={`shrink-0 font-mono text-6xl leading-none font-black tracking-tight sm:text-7xl md:text-8xl ${accent.num}`}
                                    >
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <p className="text-2xl leading-snug font-light text-balance text-foreground sm:text-3xl md:text-4xl">
                                        <span className="text-muted-foreground">{entry.text}</span>{' '}
                                        <span className="font-medium">{entry.highlight}</span>
                                    </p>
                                </div>

                                {/* Divider — sans la barre coloree à côté du num, juste gradient horizontal fin */}
                                {!isLast ? (
                                    <div className="mt-12 flex items-center gap-3" aria-hidden>
                                        <div className={`h-px flex-1 bg-linear-to-r ${accent.line}`} />
                                        <div className={`h-1.5 w-1.5 rounded-full ${accent.dot} opacity-40`} />
                                    </div>
                                ) : null}
                            </motion.li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}
