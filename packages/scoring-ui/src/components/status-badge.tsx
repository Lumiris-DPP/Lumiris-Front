'use client';

import type { HTMLAttributes } from 'react';
import type {
    CertificationStatus,
    JournalStatus,
    ModerationStatus,
    PassportStatus,
    RegulatoryStatus,
} from '@lumiris/types';
import { cn } from '@lumiris/ui/lib/cn';

export type StatusBadgeSize = 'sm' | 'md';

interface StatusConfig {
    label: string;
    tone: string;
}

const SIZE: Record<StatusBadgeSize, string> = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
};

const FALLBACK: StatusConfig = {
    label: '-',
    tone: 'bg-muted text-muted-foreground border-border',
};

function renderBadge(
    config: StatusConfig,
    size: StatusBadgeSize,
    className?: string,
    rest?: HTMLAttributes<HTMLSpanElement>,
) {
    return (
        <span
            className={cn('inline-flex items-center rounded-md border font-medium', SIZE[size], config.tone, className)}
            {...rest}
        >
            {config.label}
        </span>
    );
}

export type AtelierStatus = PassportStatus | CertificationStatus | JournalStatus | RegulatoryStatus;

export interface AtelierStatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
    status: AtelierStatus | (string & {});
    size?: StatusBadgeSize;
}

const ATELIER_STATUS_CONFIG: Record<string, StatusConfig> = {
    Draft: { label: 'Brouillon', tone: 'bg-muted text-muted-foreground border-border' },
    InCompletion: {
        label: 'En complétion',
        tone: 'border-lumiris-amber/25 bg-lumiris-amber/10 text-lumiris-amber',
    },
    Published: {
        label: 'Publié',
        tone: 'border-lumiris-emerald/20 bg-lumiris-emerald/8 text-lumiris-emerald',
    },
    Valid: {
        label: 'Valide',
        tone: 'border-lumiris-emerald/20 bg-lumiris-emerald/8 text-lumiris-emerald',
    },
    Expired: {
        label: 'Expiré',
        tone: 'border-lumiris-rose/20 bg-lumiris-rose/8 text-lumiris-rose',
    },
    Unverified: {
        label: 'Non vérifié',
        tone: 'border-lumiris-amber/25 bg-lumiris-amber/10 text-lumiris-amber',
    },
    Scheduled: {
        label: 'Programmé',
        tone: 'border-lumiris-cyan/25 bg-lumiris-cyan/10 text-lumiris-cyan',
    },
    Active: {
        label: 'Actif',
        tone: 'border-lumiris-emerald/20 bg-lumiris-emerald/8 text-lumiris-emerald',
    },
    Pending: {
        label: 'En attente',
        tone: 'border-lumiris-amber/25 bg-lumiris-amber/10 text-lumiris-amber',
    },
};

export function AtelierStatusBadge({ status, size = 'sm', className, ...rest }: AtelierStatusBadgeProps) {
    const config = ATELIER_STATUS_CONFIG[status] ?? { ...FALLBACK, label: String(status) };
    return renderBadge(config, size, className, rest);
}

export interface ModerationStatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
    status: ModerationStatus | (string & {});
    size?: StatusBadgeSize;
}

const MODERATION_STATUS_CONFIG: Record<string, StatusConfig> = {
    PendingReview: {
        label: 'À modérer',
        tone: 'border-lumiris-amber/25 bg-lumiris-amber/10 text-lumiris-amber',
    },
    Approved: {
        label: 'Approuvé',
        tone: 'border-lumiris-emerald/20 bg-lumiris-emerald/8 text-lumiris-emerald',
    },
    Rejected: {
        label: 'Rejeté',
        tone: 'border-lumiris-rose/20 bg-lumiris-rose/8 text-lumiris-rose',
    },
};

export function ModerationStatusBadge({ status, size = 'sm', className, ...rest }: ModerationStatusBadgeProps) {
    const config = MODERATION_STATUS_CONFIG[status] ?? { ...FALLBACK, label: String(status) };
    return renderBadge(config, size, className, rest);
}
