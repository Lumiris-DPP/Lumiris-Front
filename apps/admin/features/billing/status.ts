import type { ComponentProps } from 'react';
import type { Badge } from '@lumiris/ui/components/badge';

export type BillingTone = 'success' | 'info' | 'warning' | 'neutral' | 'destructive';

export const BILLING_STATUS = {
    trialing: { label: 'Essai', tone: 'info' },
    active: { label: 'Actif', tone: 'success' },
    past_due: { label: 'Impayé', tone: 'warning' },
    canceled: { label: 'Annulé', tone: 'neutral' },
    succeeded: { label: 'Réussi', tone: 'success' },
    refunded: { label: 'Remboursé', tone: 'neutral' },
    failed: { label: 'Échec', tone: 'destructive' },
} as const satisfies Record<string, { label: string; tone: BillingTone }>;

export type BillingStatusKey = keyof typeof BILLING_STATUS;

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>['variant']>;

const TONE_STYLE: Record<BillingTone, { variant: BadgeVariant; className: string }> = {
    success: {
        variant: 'outline',
        className: 'border-lumiris-emerald/40 bg-lumiris-emerald/10 text-lumiris-emerald',
    },
    info: {
        variant: 'outline',
        className: 'border-lumiris-cyan/40 bg-lumiris-cyan/10 text-lumiris-cyan',
    },
    warning: {
        variant: 'outline',
        className: 'border-lumiris-amber/40 bg-lumiris-amber/10 text-lumiris-amber',
    },
    neutral: { variant: 'secondary', className: '' },
    destructive: { variant: 'destructive', className: '' },
};

export interface StatusBadgeProps {
    variant: BadgeVariant;
    className: string;
    label: string;
}

export function statusBadgeProps(status: BillingStatusKey): StatusBadgeProps {
    const cfg = BILLING_STATUS[status];
    const style = TONE_STYLE[cfg.tone];
    return { variant: style.variant, className: style.className, label: cfg.label };
}
