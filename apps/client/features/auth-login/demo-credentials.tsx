'use client';

import Image from 'next/image';
import { cn } from '@lumiris/ui/lib/cn';
import { DEMO_CREDENTIALS, MOCK_PASSWORD } from '@/lib/mock-auth';

const TIER_BADGE: Record<'Solo' | 'Studio' | 'Maison', string> = {
    Solo: 'bg-tier-solo/15 text-tier-solo',
    Studio: 'bg-tier-studio/15 text-tier-studio',
    Maison: 'bg-tier-maison/15 text-tier-maison',
};

/** Collapsible list of demo ateliers that pre-fills the login email on click. */
export function DemoCredentials({ onPick }: { onPick: (email: string) => void }) {
    return (
        <details className="text-muted-foreground group mt-6 text-xs">
            <summary className="hover:text-foreground cursor-pointer list-none text-center underline-offset-4 hover:underline">
                Tester un atelier démo · password = «{MOCK_PASSWORD}»
            </summary>
            <ul className="border-border bg-card/60 mt-3 divide-y rounded-lg border">
                {DEMO_CREDENTIALS.map(({ artisan, email: demoEmail }) => (
                    <li key={artisan.id}>
                        <button
                            type="button"
                            onClick={() => onPick(demoEmail)}
                            className="hover:bg-accent/40 focus-visible:bg-accent/40 flex w-full items-center gap-3 px-3 py-2 text-left transition-colors focus-visible:outline-none"
                            aria-label={`Pré-remplir l'e-mail de ${artisan.displayName}`}
                        >
                            <Image
                                src={artisan.photoUrl}
                                alt=""
                                width={32}
                                height={32}
                                className="bg-muted h-8 w-8 shrink-0 rounded-full object-cover"
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-foreground truncate text-xs font-medium">
                                        {artisan.displayName}
                                    </span>
                                    <span
                                        className={cn(
                                            'shrink-0 rounded px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-wider',
                                            TIER_BADGE[artisan.tier],
                                        )}
                                    >
                                        {artisan.tier}
                                    </span>
                                </div>
                                <p className="text-muted-foreground/90 truncate font-mono text-[11px]">{demoEmail}</p>
                            </div>
                        </button>
                    </li>
                ))}
            </ul>
        </details>
    );
}
