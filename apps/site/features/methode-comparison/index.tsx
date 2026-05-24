'use client';

import { Check, X } from 'lucide-react';

const COMPARISON = [
    { criterion: 'Open source', higg: false, ecoscore: true, auto: false, iris: true },
    { criterion: 'Score non achetable', higg: false, ecoscore: true, auto: false, iris: true },
    { criterion: 'Adapté artisanat', higg: false, ecoscore: false, auto: false, iris: true },
    { criterion: 'Traçabilité vérifiable', higg: true, ecoscore: false, auto: false, iris: true },
    { criterion: 'Critères sociaux', higg: true, ecoscore: false, auto: false, iris: true },
    { criterion: 'Audit indépendant', higg: true, ecoscore: false, auto: false, iris: true },
];

function StatusIcon({ value }: { value: boolean }) {
    return value ? (
        <div
            className="bg-lumiris-cyan/10 flex h-7 w-7 items-center justify-center rounded-full"
            aria-label="Disponible"
        >
            <Check className="text-lumiris-cyan h-4 w-4" aria-hidden />
        </div>
    ) : (
        <div className="bg-muted flex h-7 w-7 items-center justify-center rounded-full" aria-label="Non disponible">
            <X className="text-muted-foreground/50 h-4 w-4" aria-hidden />
        </div>
    );
}

export function MethodeComparison() {
    return (
        <section className="py-24 sm:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <div className="mb-16 text-center">
                    <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
                        Comparaison avec les autres systèmes
                    </h2>
                    <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg">
                        Comment Iris se positionne par rapport aux méthodes existantes.
                    </p>
                </div>

                {/* Comparison cards */}
                <div className="space-y-3">
                    {/* Header row */}
                    <div className="hidden items-center gap-4 px-4 sm:flex">
                        <div className="flex-1" />
                        <div className="w-20 text-center">
                            <span className="text-muted-foreground text-xs font-medium">Higg</span>
                        </div>
                        <div className="w-20 text-center">
                            <span className="text-muted-foreground text-xs font-medium">Eco-Score</span>
                        </div>
                        <div className="w-20 text-center">
                            <span className="text-muted-foreground text-xs font-medium">Auto-décl.</span>
                        </div>
                        <div className="w-20 text-center">
                            <span className="text-lumiris-cyan text-xs font-semibold">Iris</span>
                        </div>
                    </div>

                    {/* Data rows */}
                    {COMPARISON.map((row) => (
                        <div
                            key={row.criterion}
                            className="bg-card border-border flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:gap-4"
                        >
                            <div className="flex-1">
                                <span className="text-foreground text-sm font-medium">{row.criterion}</span>
                            </div>
                            <div className="flex items-center gap-4 sm:gap-0">
                                <div className="flex w-20 flex-col items-center gap-1 sm:gap-0">
                                    <span className="text-muted-foreground text-[10px] sm:hidden">Higg</span>
                                    <StatusIcon value={row.higg} />
                                </div>
                                <div className="flex w-20 flex-col items-center gap-1 sm:gap-0">
                                    <span className="text-muted-foreground text-[10px] sm:hidden">Eco-Score</span>
                                    <StatusIcon value={row.ecoscore} />
                                </div>
                                <div className="flex w-20 flex-col items-center gap-1 sm:gap-0">
                                    <span className="text-muted-foreground text-[10px] sm:hidden">Auto-décl.</span>
                                    <StatusIcon value={row.auto} />
                                </div>
                                <div className="flex w-20 flex-col items-center gap-1 sm:gap-0">
                                    <span className="text-lumiris-cyan text-[10px] font-medium sm:hidden">Iris</span>
                                    <StatusIcon value={row.iris} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
