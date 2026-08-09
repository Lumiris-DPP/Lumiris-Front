'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, Package, RotateCcw } from 'lucide-react';
import { useSellerOrders } from '@lumiris/api-client/react';
import { Button } from '@lumiris/ui/components/button';
import { useAuthStore } from '@/lib/auth-store';

// Une commande payée attend un colis, et un litige attend une réponse : ces deux dettes doivent
// se voir depuis l'écran d'accueil, pas seulement en ouvrant l'onglet Commandes. Le bloc
// disparaît quand il n'y a rien à faire — un tableau de bord ne montre pas des zéros.
export function OrdersCallout() {
    const token = useAuthStore((s) => s.token);
    const { data: orders = [] } = useSellerOrders({ enabled: Boolean(token) });

    const toShip = orders.filter((o) => o.canShip).length;
    const returns = orders.filter((o) => o.canDecideReturn || o.canMarkReturnReceived).length;
    const disputes = orders.filter((o) => o.disputeStatus === 'OPEN').length;
    if (toShip + returns + disputes === 0) {
        return null;
    }

    const duties = [
        { count: toShip, icon: Package, singular: 'commande à expédier', plural: 'commandes à expédier' },
        { count: returns, icon: RotateCcw, singular: 'retour à traiter', plural: 'retours à traiter' },
        { count: disputes, icon: AlertTriangle, singular: 'litige ouvert', plural: 'litiges ouverts' },
    ].filter((duty) => duty.count > 0);

    return (
        <section className="flex flex-col gap-3 rounded-xl border border-lumiris-cyan/40 bg-lumiris-cyan/5 p-4 md:flex-row md:items-center md:justify-between">
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {duties.map(({ count, icon: Icon, singular, plural }) => (
                    <li key={singular} className="flex items-center gap-2 text-sm">
                        <Icon className="h-4 w-4 shrink-0 text-lumiris-cyan" aria-hidden />
                        <span className="font-semibold text-foreground tabular-nums">{count}</span>
                        <span className="text-muted-foreground">{count > 1 ? plural : singular}</span>
                    </li>
                ))}
            </ul>
            <Button asChild className="shrink-0 gap-1.5 bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90">
                <Link href="/commandes">
                    Traiter maintenant
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </Button>
        </section>
    );
}
