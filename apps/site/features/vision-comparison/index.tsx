'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

const FEATURES = [
    { feature: "Scanner n'importe quel DPP", noAccount: true, withAccount: true },
    { feature: 'Voir le score Iris', noAccount: true, withAccount: true },
    { feature: 'Consulter la composition', noAccount: true, withAccount: true },
    { feature: 'Enregistrer dans Garde-Robe', noAccount: false, withAccount: true },
    { feature: 'Historique des scans', noAccount: false, withAccount: true },
    { feature: "Conseils d'entretien", noAccount: false, withAccount: true },
    { feature: 'Alertes rappel produit', noAccount: false, withAccount: true },
    { feature: 'Export de données', noAccount: false, withAccount: true },
];

export function VisionComparison() {
    return (
        <section className="py-20 sm:py-28">
            <div className="mx-auto max-w-4xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5 }}
                    className="mb-10 text-center"
                >
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Gratuit, pour toujours
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                        Créez un compte pour débloquer toutes les fonctionnalités — sans payer un centime.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="overflow-hidden rounded-2xl border border-border"
                >
                    <table className="w-full">
                        <thead>
                            <tr className="bg-muted/50">
                                <th className="px-4 py-4 text-left text-sm font-semibold text-foreground sm:px-6">
                                    Fonctionnalité
                                </th>
                                <th className="w-28 px-4 py-4 text-center text-sm font-medium text-muted-foreground sm:w-32 sm:px-6">
                                    Sans compte
                                </th>
                                <th className="w-28 px-4 py-4 text-center text-sm font-semibold text-foreground sm:w-32 sm:px-6">
                                    Avec compte
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {FEATURES.map((row, index) => (
                                <tr key={row.feature} className={index % 2 === 0 ? 'bg-card' : 'bg-background'}>
                                    <td className="px-4 py-3 text-sm text-foreground sm:px-6">{row.feature}</td>
                                    <td className="px-4 py-3 text-center sm:px-6">
                                        {row.noAccount ? (
                                            <Check className="mx-auto h-5 w-5 text-lumiris-cyan" aria-label="Inclus" />
                                        ) : (
                                            <X
                                                className="mx-auto h-5 w-5 text-muted-foreground/40"
                                                aria-label="Non inclus"
                                            />
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center sm:px-6">
                                        {row.withAccount ? (
                                            <Check className="mx-auto h-5 w-5 text-lumiris-cyan" aria-label="Inclus" />
                                        ) : (
                                            <X
                                                className="mx-auto h-5 w-5 text-muted-foreground/40"
                                                aria-label="Non inclus"
                                            />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            </div>
        </section>
    );
}
