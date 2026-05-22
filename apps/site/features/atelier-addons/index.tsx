'use client';

import { Info, Layers, Wrench } from 'lucide-react';
import { Card, CardContent } from '@lumiris/ui/components/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@lumiris/ui/components/tooltip';

interface Addon {
    name: string;
    pricing: string;
    summary: string;
    detail: string;
    icon: typeof Layers;
}

const ADDONS: readonly Addon[] = [
    {
        name: 'ATELIER+',
        pricing: '19 €/mois · 190 €/an',
        summary: 'Mise en avant Discover · badge premium.',
        detail: 'À score équivalent uniquement. Inclut le ré-engagement client après scan.',
        icon: Layers,
    },
    {
        name: 'LUMIRIS Local',
        pricing: '19 €/mois · 190 €/an',
        summary: 'Profil enrichi · badge partenaire.',
        detail: 'Remontée prioritaire dans les recherches locales. Commission 4-10 € ou 8 % du devis.',
        icon: Wrench,
    },
];

export function AtelierAddons() {
    return (
        <TooltipProvider delayDuration={150}>
            <ul className="grid gap-6 sm:grid-cols-2">
                {ADDONS.map(({ name, pricing, summary, detail, icon: Icon }) => (
                    <li key={name}>
                        <Card className="h-full">
                            <CardContent className="flex h-full flex-col gap-3 p-6">
                                <div className="flex items-center gap-3">
                                    <Icon className="text-grade-c h-5 w-5" aria-hidden="true" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <h3 className="text-foreground text-base font-semibold">{name}</h3>
                                            <Tooltip>
                                                <TooltipTrigger
                                                    aria-label={`Détails ${name}`}
                                                    className="text-muted-foreground hover:text-foreground rounded-full"
                                                >
                                                    <Info className="h-3.5 w-3.5" aria-hidden="true" />
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="max-w-xs">
                                                    {detail}
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <p className="text-muted-foreground font-mono text-[11px]">{pricing}</p>
                                    </div>
                                </div>
                                <p className="text-muted-foreground text-sm leading-relaxed">{summary}</p>
                            </CardContent>
                        </Card>
                    </li>
                ))}
            </ul>
        </TooltipProvider>
    );
}
