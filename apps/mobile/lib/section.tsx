import type { LucideIcon } from 'lucide-react';
import { cn } from '@lumiris/ui/lib/cn';

/**
 * Muted, small-caps label that sits above a section's body (cards, lists…).
 * Shared by the feature screens that previously each redefined it inline.
 */
export function SectionLabel({ title, Icon, className }: { title: string; Icon?: LucideIcon; className?: string }) {
    return (
        <h2
            className={cn(
                'text-muted-foreground inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider',
                className,
            )}
        >
            {Icon ? <Icon className="h-3 w-3" /> : null}
            {title}
        </h2>
    );
}

/** Stronger, foreground section heading used on the DPP detail screens. */
export function SectionHeading({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <h2 className={cn('text-foreground text-xs font-semibold uppercase tracking-[0.18em]', className)}>
            {children}
        </h2>
    );
}
