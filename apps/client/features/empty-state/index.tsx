'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent } from '@lumiris/ui/components/card';
import { cn } from '@lumiris/ui/lib/cn';

export type EmptyStateTone = 'emerald' | 'amber';

export interface EmptyStateAction {
    label: string;
    href?: string;
    onClick?: () => void;
}

export interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    cta?: EmptyStateAction;
    tone?: EmptyStateTone;
    className?: string;
    /** Custom action node rendered in the CTA slot (takes precedence over `cta`). */
    children?: React.ReactNode;
}

const TONE_CLASSES: Record<EmptyStateTone, string> = {
    emerald: 'bg-lumiris-cyan/10 text-lumiris-cyan',
    amber: 'bg-lumiris-amber/10 text-lumiris-amber',
};

const CTA_CLASSES: Record<EmptyStateTone, string> = {
    emerald: 'bg-lumiris-cyan hover:bg-lumiris-cyan/90 text-white',
    amber: 'bg-lumiris-amber hover:bg-lumiris-amber/90 text-white',
};

export function EmptyState({
    icon: Icon,
    title,
    description,
    cta,
    tone = 'emerald',
    className,
    children,
}: EmptyStateProps) {
    return (
        <Card className={cn('mx-auto max-w-2xl', className)}>
            <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-full', TONE_CLASSES[tone])}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-foreground text-lg font-semibold">{title}</h2>
                    <p className="text-muted-foreground max-w-md text-sm">{description}</p>
                </div>
                {children ?? (cta && <EmptyStateCta cta={cta} tone={tone} />)}
            </CardContent>
        </Card>
    );
}

function EmptyStateCta({ cta, tone }: { cta: EmptyStateAction; tone: EmptyStateTone }) {
    if (cta.href) {
        return (
            <Button asChild className={CTA_CLASSES[tone]}>
                <Link href={cta.href}>{cta.label}</Link>
            </Button>
        );
    }
    return (
        <Button onClick={cta.onClick} className={CTA_CLASSES[tone]}>
            {cta.label}
        </Button>
    );
}
