'use client';

import { Skeleton } from '@lumiris/ui/components/skeleton';
import { cn } from '@lumiris/ui/lib/cn';

interface LoadingStateProps {
    rows?: number;
    label?: string;
    className?: string;
}

export function LoadingState({ rows = 4, label = 'Chargement en cours…', className }: LoadingStateProps) {
    const safeRows = Math.max(1, Math.min(20, rows));
    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            className={cn('border-border bg-card space-y-3 rounded-xl border p-4', className)}
        >
            <span className="sr-only">{label}</span>
            {Array.from({ length: safeRows }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-2 w-full" />
                </div>
            ))}
        </div>
    );
}
