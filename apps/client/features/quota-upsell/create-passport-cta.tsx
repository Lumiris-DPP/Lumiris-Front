'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@lumiris/ui/components/button';
import { useBilling } from '@/lib/billing-store';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { usePassports } from '@/lib/passports-source';
import { activePassportCount, isQuotaReached } from '@/lib/quota';
import { QuotaUpsellDialog } from './index';

interface CreatePassportCtaProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'sm' | 'default' | 'lg' | 'icon';
}

export function CreatePassportCta({ children, className, variant, size }: CreatePassportCtaProps) {
    const artisan = useCurrentArtisan();
    const billing = useBilling(artisan.id);
    const passports = usePassports(artisan.id);
    const [open, setOpen] = useState(false);

    const blocked = isQuotaReached(passports, billing.tier);

    if (!blocked) {
        return (
            <Button asChild className={className} variant={variant} size={size}>
                <Link href="/create">{children}</Link>
            </Button>
        );
    }

    return (
        <>
            <Button type="button" onClick={() => setOpen(true)} className={className} variant={variant} size={size}>
                {children}
            </Button>
            <QuotaUpsellDialog
                open={open}
                onOpenChange={setOpen}
                currentTier={billing.tier}
                used={activePassportCount(passports)}
            />
        </>
    );
}
