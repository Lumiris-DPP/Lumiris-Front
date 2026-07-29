'use client';

import * as React from 'react';
import { cn } from '@lumiris/ui/lib/cn';

type Intensity = 'subtle' | 'default' | 'strong';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    intensity?: Intensity;
    asChild?: never;
}

const BLUR: Record<Intensity, string> = {
    subtle: 'backdrop-blur-md',
    default: 'backdrop-blur-xl',
    strong: 'backdrop-blur-2xl',
};

export function GlassCard({ className, intensity = 'default', children, ...rest }: GlassCardProps) {
    return (
        <div
            className={cn(
                'relative rounded-3xl border border-border/40 bg-card/70 shadow-lg',
                BLUR[intensity],
                className,
            )}
            {...rest}
        >
            {children}
        </div>
    );
}
