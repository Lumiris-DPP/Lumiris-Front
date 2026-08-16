'use client';

import { Check } from 'lucide-react';
import { cn } from '@lumiris/ui/lib/cn';

interface ChipProps {
    children: React.ReactNode;
    selected: boolean;
    onClick: () => void;
    disabled?: boolean;
    showCheck?: boolean;
    className?: string;
}

export function Chip({ children, selected, onClick, disabled = false, showCheck = true, className }: ChipProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            aria-disabled={disabled}
            disabled={disabled}
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none',
                selected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/60 bg-card text-muted-foreground hover:text-foreground',
                disabled && 'line-through opacity-50',
                className,
            )}
        >
            {selected && showCheck ? <Check className="h-3 w-3" strokeWidth={2} aria-hidden /> : null}
            {children}
        </button>
    );
}
