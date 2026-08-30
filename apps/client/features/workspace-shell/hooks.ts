'use client';

import { useMemo } from 'react';
import type { Artisan, ArtisanTier } from '@lumiris/types';
import { useNotifications, useSellerOrders } from '@lumiris/api-client/react';
import { useAuthStore } from '@/lib/auth-store';
import { useBilling } from '@/lib/billing-store';
import { usePassports } from '@/lib/passports-source';
import { buildNotifications, toAtelierNotifications, type AtelierNotification } from '@/lib/notifications';

export const ATELIER_PASSPORT_LIMIT_LABEL: Record<ArtisanTier, string> = {
    Solo: '50',
    Studio: '300',
    Maison: '∞',
};

export function usePassportCount(artisanId: string): number {
    const passports = usePassports(artisanId);
    return passports.filter((p) => p.status !== 'Draft').length;
}

export function useHasAtelierPlus(artisanId: string): boolean {
    return useBilling(artisanId).atelierPlus;
}

// Commandes qui attendent une action du vendeur : colis à expédier, retour à trancher ou à
// réceptionner, litige ouvert. Alimente le compteur de la navigation.
export function usePendingOrderCount(): number {
    const token = useAuthStore((s) => s.token);
    const { data: orders = [] } = useSellerOrders({ enabled: Boolean(token) });
    return orders.filter(
        (order) =>
            order.canShip || order.canDecideReturn || order.canMarkReturnReceived || order.disputeStatus === 'OPEN',
    ).length;
}

// Deux sources dans la même cloche : les alertes dérivées de l'état local (certification qui
// expire, passeport incomplet) et les notifications serveur, qui portent le cycle de vie des
// commandes. Les secondes passent devant : une commande à expédier prime sur un rappel.
export function useWorkspaceNotifications(artisan: Artisan): readonly AtelierNotification[] {
    const passports = usePassports(artisan.id);
    const token = useAuthStore((s) => s.token);
    const { data: serverNotifications = [] } = useNotifications({ enabled: Boolean(token) });

    return useMemo(
        () => [
            ...toAtelierNotifications(serverNotifications),
            ...buildNotifications({
                artisan,
                passports,
                hasServerNotifications: serverNotifications.length > 0,
            }),
        ],
        [serverNotifications, artisan, passports],
    );
}
