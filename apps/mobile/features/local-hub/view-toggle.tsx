'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { List, Map as MapIcon } from 'lucide-react';
import type { ComponentType } from 'react';
import { cn } from '@lumiris/ui/lib/cn';

export type LocalView = 'list' | 'map';

interface ViewToggleProps {
    value: LocalView;
    onChange: (next: LocalView) => void;
}

interface OptionDef {
    id: LocalView;
    label: string;
    Icon: ComponentType<{ className?: string }>;
}

const OPTIONS: readonly OptionDef[] = [
    { id: 'list', label: 'Liste', Icon: List },
    { id: 'map', label: 'Carte', Icon: MapIcon },
];

export function ViewToggle({ value, onChange }: ViewToggleProps) {
    const prefersReduced = useReducedMotion();
    return (
        <div
            role="tablist"
            aria-label="Mode d'affichage"
            className="inline-flex items-center rounded-full border border-border/60 bg-card p-0.5"
        >
            {OPTIONS.map(({ id, label, Icon }) => {
                const active = value === id;
                return (
                    <motion.button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        whileTap={prefersReduced ? undefined : { scale: 0.95 }}
                        onClick={() => onChange(id)}
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none',
                            active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                    </motion.button>
                );
            })}
        </div>
    );
}
