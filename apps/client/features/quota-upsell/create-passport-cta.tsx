'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '@lumiris/ui/components/button';

import { useSubscriptionGate } from '@/lib/use-subscription-gate';

interface CreatePassportCtaProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'sm' | 'default' | 'lg' | 'icon';
    onNavigate?: () => void;
}

// Créer un passeport exige un abonnement ATELIER actif : sans abonnement le bouton reste
// cliquable mais n'ouvre pas le wizard — il explique le refus (voir RequireSubscription
// pour l'accès direct par URL).
export function CreatePassportCta({ children, className, variant, size, onNavigate }: CreatePassportCtaProps) {
    const { blocked, notifyBlocked } = useSubscriptionGate();

    if (blocked) {
        return (
            <Button className={className} variant={variant} size={size} onClick={notifyBlocked}>
                {children}
            </Button>
        );
    }

    return (
        <Button asChild className={className} variant={variant} size={size}>
            <Link href="/create" onClick={onNavigate}>
                {children}
            </Link>
        </Button>
    );
}
