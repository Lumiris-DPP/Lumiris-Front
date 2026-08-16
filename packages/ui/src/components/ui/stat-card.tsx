import type { ComponentType } from 'react';

import { Card, CardContent } from './card';
import { cn } from '../../lib/cn';

export interface StatCardProps {
    label: string;
    value: string;
    hint?: string;
    icon?: ComponentType<{ className?: string }>;
    className?: string;
}

// `value` est une chaîne : la carte ne connaît ni monnaie ni locale, l'appelant formate.
export function StatCard({ label, value, hint, icon: Icon, className }: StatCardProps) {
    return (
        <Card className={className}>
            <CardContent className="p-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                    <span className={cn(!Icon && 'text-[11px] tracking-wider uppercase')}>{label}</span>
                </div>
                <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">{value}</p>
                {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
            </CardContent>
        </Card>
    );
}
