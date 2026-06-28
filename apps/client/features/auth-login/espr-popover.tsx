'use client';

import { ShieldCheck } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@lumiris/ui/components/popover';
import { ESPR_TEXTILE_TIMELINE } from '@/lib/regulatory';

/** ESPR-compliance footer chip with the textile DPP regulatory timeline. */
export function EsprTimelinePopover() {
    return (
        <Popover>
            <PopoverTrigger className="text-muted-foreground hover:text-foreground mx-auto mt-8 flex items-center gap-1.5 text-xs transition-colors focus:outline-none">
                <ShieldCheck className="text-lumiris-emerald h-3.5 w-3.5" />
                Conforme ESPR · acte délégué textile attendu 2027 · application mi-2028
            </PopoverTrigger>
            <PopoverContent align="center" className="w-80">
                <p className="text-foreground text-sm font-medium">Calendrier ESPR textile</p>
                <p className="text-muted-foreground mt-1 text-xs">
                    LUMIRIS anticipe l&apos;obligation européenne de Passeport Numérique Produit.
                </p>
                <ol className="mt-3 space-y-2.5">
                    {ESPR_TEXTILE_TIMELINE.map((milestone) => (
                        <li key={milestone.date} className="flex gap-3">
                            <span className="text-lumiris-emerald shrink-0 font-mono text-xs font-semibold">
                                {milestone.date}
                            </span>
                            <span className="text-foreground text-xs leading-relaxed">{milestone.label}</span>
                        </li>
                    ))}
                </ol>
            </PopoverContent>
        </Popover>
    );
}
