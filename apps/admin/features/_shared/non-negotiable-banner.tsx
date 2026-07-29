'use client';

import { Lock } from 'lucide-react';
import { cn } from '@lumiris/ui/lib/cn';

interface NonNegotiableBannerProps {
    rule: string;
    className?: string;
}

export function NonNegotiableBanner({ rule, className }: NonNegotiableBannerProps) {
    return (
        <div
            role="note"
            aria-label="Règle non-négociable LUMIRIS"
            className={cn(
                'flex h-9 items-center gap-2 rounded-md border border-lumiris-amber/30 bg-lumiris-amber/5 px-3 text-xs font-medium text-lumiris-amber',
                className,
            )}
        >
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <p className="truncate">{rule}</p>
        </div>
    );
}
