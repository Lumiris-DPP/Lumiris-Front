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
                'border-lumiris-amber/30 bg-lumiris-amber/5 text-lumiris-amber flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed',
                className,
            )}
        >
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <p className="flex-1 font-medium">{rule}</p>
        </div>
    );
}
