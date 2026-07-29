'use client';

import { ShieldCheck } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@lumiris/ui/components/popover';
import { ESPR_TEXTILE_TIMELINE } from '@/lib/regulatory';

/** ESPR-compliance footer chip with the textile DPP regulatory timeline. */
export function EsprTimelinePopover() {
    return (
        <Popover>
            <PopoverTrigger className="mx-auto mt-8 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground focus:outline-none">
                <ShieldCheck className="h-3.5 w-3.5 text-lumiris-cyan" />
                Conforme ESPR · acte délégué textile attendu 2027 · application mi-2028
            </PopoverTrigger>
            <PopoverContent align="center" className="w-80">
                <p className="text-sm font-medium text-foreground">Calendrier ESPR textile</p>
                <p className="mt-1 text-xs text-muted-foreground">
                    LUMIRIS anticipe l&apos;obligation européenne de Passeport Numérique Produit.
                </p>
                <ol className="mt-3 space-y-2.5">
                    {ESPR_TEXTILE_TIMELINE.map((milestone) => (
                        <li key={milestone.date} className="flex gap-3">
                            <span className="shrink-0 font-mono text-xs font-semibold text-lumiris-cyan">
                                {milestone.date}
                            </span>
                            <span className="text-xs leading-relaxed text-foreground">{milestone.label}</span>
                        </li>
                    ))}
                </ol>
            </PopoverContent>
        </Popover>
    );
}
