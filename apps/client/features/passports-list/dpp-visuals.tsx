'use client';

import type { DppStatus } from '@lumiris/api-client';
import { cn } from '@lumiris/ui/lib/cn';

interface StatusVisual {
    label: string;
    badge: string;
    tile: string;
}

const STATUS_VISUAL: Record<DppStatus, StatusVisual> = {
    DRAFT: {
        label: 'Brouillon',
        badge: 'border-lumiris-amber/25 bg-lumiris-amber/10 text-lumiris-amber',
        tile: 'border-border bg-muted text-muted-foreground',
    },
    VALID: {
        label: 'Publié',
        badge: 'border-lumiris-emerald/25 bg-lumiris-emerald/10 text-lumiris-emerald',
        tile: 'border-lumiris-cyan/20 bg-lumiris-cyan/10 text-lumiris-cyan',
    },
    INVALID: {
        label: 'Invalide',
        badge: 'border-lumiris-rose/25 bg-lumiris-rose/10 text-lumiris-rose',
        tile: 'border-lumiris-rose/20 bg-lumiris-rose/10 text-lumiris-rose',
    },
};

export function dppStatusLabel(status: DppStatus): string {
    return STATUS_VISUAL[status].label;
}

export function DppStatusBadge({ status, className }: { status: DppStatus; className?: string }) {
    const visual = STATUS_VISUAL[status];
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
                visual.badge,
                className,
            )}
        >
            <span className="size-1.5 rounded-full bg-current" aria-hidden />
            {visual.label}
        </span>
    );
}

function initials(productName: string | null): string {
    const words = (productName ?? '').trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '—';
    return words
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase())
        .join('');
}

export function DppTile({
    productName,
    status,
    className,
}: {
    productName: string | null;
    status: DppStatus;
    className?: string;
}) {
    return (
        <span
            aria-hidden
            className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-lg border text-[11px] font-semibold tracking-wide transition-colors',
                STATUS_VISUAL[status].tile,
                className,
            )}
        >
            {initials(productName)}
        </span>
    );
}
