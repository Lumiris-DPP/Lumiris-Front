import { Sparkles } from 'lucide-react';
import { cn } from '@lumiris/ui/lib/cn';

// Badge explicite « ATELIER+ » (LUMIRIS-9) : signale un artisan abonné à l'add-on
// ATELIER+, prioritaire à score égal dans les suggestions.
export function AtelierPlusBadge({ className }: { className?: string }) {
    return (
        <span
            className={cn(
                'border-lumiris-cyan/30 bg-card/95 text-lumiris-cyan inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide backdrop-blur-sm',
                className,
            )}
            title="Artisan abonné ATELIER+"
        >
            <Sparkles className="h-2.5 w-2.5" strokeWidth={2} aria-hidden />
            ATELIER+
        </span>
    );
}
