'use client';

import type { ComponentType, ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@lumiris/ui/lib/cn';

interface EmptyStateProps {
    icon?: ComponentType<{ className?: string }>;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }: EmptyStateProps) {
    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                'border-border bg-card mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center',
                className,
            )}
        >
            <Icon className="text-muted-foreground h-8 w-8" aria-hidden />
            <div className="space-y-1">
                <p className="text-foreground text-sm font-semibold">{title}</p>
                {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
            </div>
            {action ? <div className="mt-1">{action}</div> : null}
        </div>
    );
}
