'use client';

import { useOrderConfirmation } from './hooks/use-order-confirmation';
import { ConfirmationDetails } from './components/confirmation-details';
import { Suspense } from 'react';
import Link from '@/components/navigation-link';
import { useSearchParams } from 'next/navigation';

import { AlertTriangle, Loader2, LogIn } from 'lucide-react';

import { routes } from '@/lib/routes';

export function OrderConfirmation({ routeId }: { routeId: string }) {
    return (
        <Suspense fallback={<CenteredSpinner label="Récupération de ta commande…" />}>
            <OrderConfirmationInner key={routeId} routeId={routeId} />
        </Suspense>
    );
}

function OrderConfirmationInner({ routeId }: { routeId: string }) {
    const searchParams = useSearchParams();
    const { view, group, targetPi, wardrobe, refetchGroup, refetchOrders } = useOrderConfirmation(
        routeId,
        searchParams.get('payment_intent'),
    );

    if (view === 'signed-out') {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-5 bg-background px-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <LogIn className="h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-foreground">Connecte-toi pour suivre ta commande</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Connecte-toi pour retrouver ta commande, ta facture et ta pièce dans ta Garde-Robe.
                    </p>
                </div>
                <Link
                    href={`/auth/sign-in?returnTo=${encodeURIComponent(routes.order(targetPi ?? routeId))}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-primary-foreground"
                >
                    <LogIn className="h-4 w-4" />
                    Se connecter
                </Link>
            </div>
        );
    }

    if (view === 'resolving') {
        return <CenteredSpinner label="Récupération de ta commande…" />;
    }

    if (view === 'not-found') {
        return (
            <ConfirmationMessage
                title="Commande introuvable"
                description="Aucune commande de ton compte ne correspond à ce paiement."
                action={{ label: 'Voir mes commandes', href: '/me/orders' }}
            />
        );
    }

    if (view === 'no-order') {
        return (
            <ConfirmationMessage
                title="Aucune commande récente"
                description="Tes commandes apparaissent ici dès leur paiement."
                action={{ label: 'Voir la Boutique', href: '/boutique' }}
            />
        );
    }

    if (view === 'error' || !group) {
        return (
            <ConfirmationMessage
                title="Impossible d’afficher ta commande"
                description="Vérifie ta connexion puis réessaie."
                action={{
                    label: 'Réessayer',
                    onClick: () => void (targetPi ? refetchGroup() : refetchOrders()),
                }}
            />
        );
    }

    return <ConfirmationDetails group={group} view={view} targetPi={targetPi} wardrobeCount={wardrobe.length} />;
}

function ConfirmationMessage({
    title,
    description,
    action,
}: {
    title: string;
    description: string;
    action: { label: string; href: string } | { label: string; onClick: () => void };
}) {
    const className =
        'inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-primary-foreground';
    return (
        <div className="flex h-full flex-col items-center justify-center gap-5 bg-background px-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <AlertTriangle className="h-8 w-8" />
            </div>
            <div>
                <h1 className="text-lg font-bold text-foreground">{title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
            {'href' in action ? (
                <Link href={action.href} className={className}>
                    {action.label}
                </Link>
            ) : (
                <button type="button" onClick={action.onClick} className={className}>
                    {action.label}
                </button>
            )}
        </div>
    );
}

function CenteredSpinner({ label }: { label: string }) {
    return (
        <div className="flex h-full items-center justify-center gap-2 bg-background text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {label}
        </div>
    );
}
