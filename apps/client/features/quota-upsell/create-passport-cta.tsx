'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '@lumiris/ui/components/button';

interface CreatePassportCtaProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'sm' | 'default' | 'lg' | 'icon';
}

// Creating a passport is always allowed — it starts as a draft, which costs no quota.
// The subscription / quota gate lives at publication (last wizard step + backend).
export function CreatePassportCta({ children, className, variant, size }: CreatePassportCtaProps) {
    return (
        <Button asChild className={className} variant={variant} size={size}>
            <Link href="/create">{children}</Link>
        </Button>
    );
}
