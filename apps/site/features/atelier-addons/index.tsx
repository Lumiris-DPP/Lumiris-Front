'use client';

import { motion } from 'framer-motion';
import { Sparkles, Wrench, Check, ArrowRight } from 'lucide-react';

const SIGNUP_URL = 'https://client.lumiris.fr';

// Hardcoded canonical addon prices: 19 EUR/month or 190 EUR/year each
const ADDONS = [
    {
        name: 'ATELIER+',
        monthly: 19,
        yearly: 190,
        icon: Sparkles,
        color: 'violet',
        description: 'Mise en avant prioritaire dans VISION a score equivalent + analytics passeport.',
        features: [
            'Visibilite prioritaire dans les resultats VISION',
            'Statistiques detaillees par passeport',
            'Badge premium sur les fiches produit',
            'Re-engagement client apres scan',
        ],
    },
    {
        name: 'LUMIRIS Local',
        monthly: 19,
        yearly: 190,
        icon: Wrench,
        color: 'pink',
        description: 'Reseau retoucheurs, couturiers et reparateurs pour prolonger la vie des pieces.',
        features: [
            "Profil enrichi dans l'annuaire Local",
            'Remontee prioritaire recherches locales',
            'Commission 4-10 EUR ou 8% du devis',
            'Badge partenaire reparateur',
        ],
    },
] as const;

export function AtelierAddons() {
    return (
        <section className="py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5 }}
                    className="mb-10 text-center"
                >
                    <span className="inline-block rounded-full bg-lumiris-rose/10 px-3 py-1 text-xs font-medium tracking-wider text-lumiris-rose uppercase">
                        Options
                    </span>
                    <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        Boostez votre visibilite
                    </h2>
                    <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                        Des modules complementaires pour aller plus loin.
                    </p>
                </motion.div>

                <div className="grid gap-6 md:grid-cols-2">
                    {ADDONS.map((addon, index) => (
                        <motion.div
                            key={addon.name}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                            <div
                                className={`relative h-full overflow-hidden rounded-2xl border-2 bg-card p-6 transition-all hover:shadow-lg ${
                                    addon.color === 'violet'
                                        ? 'border-lumiris-iris/30 hover:border-lumiris-iris/50'
                                        : 'border-lumiris-rose/30 hover:border-lumiris-rose/50'
                                }`}
                            >
                                {/* Background decoration */}
                                <div
                                    className={`pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full blur-3xl ${
                                        addon.color === 'violet' ? 'bg-lumiris-iris/10' : 'bg-lumiris-rose/10'
                                    }`}
                                />

                                {/* Header */}
                                <div className="relative mb-5 flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                                                addon.color === 'violet' ? 'bg-lumiris-iris/10' : 'bg-lumiris-rose/10'
                                            }`}
                                        >
                                            <addon.icon
                                                className={`h-6 w-6 ${
                                                    addon.color === 'violet' ? 'text-lumiris-iris' : 'text-lumiris-rose'
                                                }`}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-foreground">{addon.name}</h3>
                                            <div className="flex items-baseline gap-1.5">
                                                <span
                                                    className={`text-lg font-bold ${
                                                        addon.color === 'violet'
                                                            ? 'text-lumiris-iris'
                                                            : 'text-lumiris-rose'
                                                    }`}
                                                >
                                                    {addon.monthly} EUR
                                                </span>
                                                <span className="text-sm text-muted-foreground">/mois</span>
                                                <span className="text-xs text-muted-foreground">
                                                    ou {addon.yearly} EUR/an
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="relative mb-5 text-sm leading-relaxed text-muted-foreground">
                                    {addon.description}
                                </p>

                                {/* Features */}
                                <ul className="relative mb-6 space-y-2.5">
                                    {addon.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-2.5 text-sm">
                                            <div
                                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                                                    addon.color === 'violet'
                                                        ? 'bg-lumiris-iris/10'
                                                        : 'bg-lumiris-rose/10'
                                                }`}
                                            >
                                                <Check
                                                    className={`h-3 w-3 ${
                                                        addon.color === 'violet'
                                                            ? 'text-lumiris-iris'
                                                            : 'text-lumiris-rose'
                                                    }`}
                                                />
                                            </div>
                                            <span className="text-muted-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <a
                                    href={SIGNUP_URL}
                                    className={`relative inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all hover:scale-[1.02] ${
                                        addon.color === 'violet'
                                            ? 'bg-lumiris-iris text-white hover:bg-lumiris-iris/90'
                                            : 'bg-lumiris-rose text-white hover:bg-lumiris-rose/90'
                                    }`}
                                >
                                    Ajouter {addon.name}
                                    <ArrowRight className="h-4 w-4" />
                                </a>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
