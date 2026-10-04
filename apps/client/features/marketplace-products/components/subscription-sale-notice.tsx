'use client';

import Link from 'next/link';
import { Button } from '@lumiris/ui/components/button';
import { useSubscription } from '@/lib/use-subscription';

// Affiche l’état de vérification de l’abonnement pour vendre.
export function SubscriptionSaleNotice() {
    const { saleState, refetch, isFetching } = useSubscription();
    if (saleState === 'active') return null;
    if (saleState === 'loading')
        return (
            <p role="status" className="text-xs text-muted-foreground">
                Vérification de l’abonnement…
            </p>
        );
    if (saleState === 'error')
        return (
            <div role="alert" className="text-xs text-muted-foreground">
                Impossible de vérifier l’abonnement. La vente reste indisponible.
                <Button variant="outline" size="sm" disabled={isFetching} onClick={() => void refetch()}>
                    Réessayer la vérification
                </Button>
            </div>
        );
    return (
        <p className="text-xs text-muted-foreground">
            Abonnement ATELIER requis pour vendre.{' '}
            <Link href="/subscription" className="text-lumiris-cyan underline">
                Voir l&apos;abonnement
            </Link>
        </p>
    );
}
