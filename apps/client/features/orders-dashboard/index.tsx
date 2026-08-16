'use client';

import { useMemo, useState } from 'react';
import { Package, PackageCheck, RotateCcw, Truck } from 'lucide-react';
import type { SellerOrder, SellerOrderTab } from '@lumiris/api-client';
import { SELLER_ORDER_TABS, SELLER_ORDER_TAB_LABEL, sellerOrderTab } from '@lumiris/api-client';
import { useSellerOrders } from '@lumiris/api-client/react';
import { Badge } from '@lumiris/ui/components/badge';
import { Skeleton } from '@lumiris/ui/components/skeleton';
import { StatCard } from '@lumiris/ui/components/stat-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@lumiris/ui/components/tabs';
import { formatPriceCents } from '@lumiris/utils';
import { useAuthStore } from '@/lib/auth-store';
import { EmptyState } from '@/features/empty-state';
import { OrdersTable } from './orders-table';
import { OrderDetailSheet } from './order-detail-sheet';

// Ce que chaque onglet dit quand il est vide — un tableau vide sans phrase laisse le vendeur
// se demander s'il attend une donnée ou s'il n'a simplement rien à faire.
const EMPTY_COPY: Record<SellerOrderTab, { title: string; description: string }> = {
    TO_SHIP: {
        title: 'Aucune commande à expédier',
        description: 'Les commandes payées apparaissent ici dès qu’un acheteur règle une pièce.',
    },
    SHIPPED: {
        title: 'Aucun colis en transit',
        description: 'Les commandes que vous expédiez restent ici jusqu’à leur livraison.',
    },
    RETURNS: {
        title: 'Aucun retour en cours',
        description: 'Les demandes de retour de vos acheteurs arrivent ici pour décision.',
    },
    DISPUTES: {
        title: 'Aucun litige ouvert',
        description: 'Un litige ouvert par un acheteur s’affiche ici en priorité.',
    },
    CLOSED: {
        title: 'Aucune commande clôturée',
        description: 'Les commandes terminées, remboursées ou annulées sont archivées ici.',
    },
};

export function OrdersDashboard() {
    const token = useAuthStore((s) => s.token);
    const { data: orders = [], isLoading } = useSellerOrders({ enabled: Boolean(token) });
    const [selected, setSelected] = useState<SellerOrder | null>(null);

    const byTab = useMemo(() => groupByTab(orders), [orders]);
    // Le vendeur arrive sur ce qui l'attend : le premier onglet non vide dans l'ordre de
    // priorité, plutôt qu'un « à expédier » vide qui masquerait un litige en cours.
    const [tab, setTab] = useState<SellerOrderTab | null>(null);
    const activeTab = tab ?? SELLER_ORDER_TABS.find((key) => byTab[key].length > 0) ?? 'TO_SHIP';

    // La commande sélectionnée doit refléter le rafraîchissement de la liste (une action change
    // son état) : on la relit dans les données fraîches plutôt que de figer une copie.
    const selectedOrder = selected ? (orders.find((o) => o.id === selected.id) ?? selected) : null;

    if (isLoading) {
        return (
            <div className="space-y-3 p-8">
                <Skeleton className="h-10 w-full max-w-md" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-4 p-8">
            <OrdersSummary orders={orders} />

            <Tabs value={activeTab} onValueChange={(value) => setTab(value as SellerOrderTab)}>
                <TabsList className="flex-wrap">
                    {SELLER_ORDER_TABS.map((key) => {
                        const count = byTab[key].length;
                        return (
                            <TabsTrigger key={key} value={key} className="gap-1.5">
                                {SELLER_ORDER_TAB_LABEL[key]}
                                {count > 0 && (
                                    <Badge
                                        variant={key === 'DISPUTES' ? 'destructive' : 'secondary'}
                                        className="h-4 min-w-4 rounded-full px-1 text-[10px] leading-none"
                                    >
                                        {count}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>

                {SELLER_ORDER_TABS.map((key) => (
                    <TabsContent key={key} value={key} className="mt-4">
                        {byTab[key].length === 0 ? (
                            <EmptyState
                                icon={Package}
                                title={EMPTY_COPY[key].title}
                                description={EMPTY_COPY[key].description}
                            />
                        ) : (
                            <OrdersTable orders={byTab[key]} onSelect={setSelected} />
                        )}
                    </TabsContent>
                ))}
            </Tabs>

            <OrderDetailSheet order={selectedOrder} onClose={() => setSelected(null)} />
        </div>
    );
}

function groupByTab(orders: readonly SellerOrder[]): Record<SellerOrderTab, SellerOrder[]> {
    const grouped: Record<SellerOrderTab, SellerOrder[]> = {
        TO_SHIP: [],
        SHIPPED: [],
        RETURNS: [],
        DISPUTES: [],
        CLOSED: [],
    };
    for (const order of orders) {
        grouped[sellerOrderTab(order.status, order.disputeStatus)].push(order);
    }
    return grouped;
}

// Trois chiffres qui répondent aux seules questions urgentes : qu'est-ce que je dois faire
// aujourd'hui, et combien d'argent m'attend.
function OrdersSummary({ orders }: { orders: readonly SellerOrder[] }) {
    const toShip = orders.filter((o) => o.canShip).length;
    const inTransit = orders.filter((o) => o.status === 'SHIPPED').length;
    const pendingReturns = orders.filter((o) => o.canDecideReturn || o.canMarkReturnReceived).length;
    const heldCents = orders.filter((o) => !o.released && o.status !== 'REFUNDED').reduce((s, o) => s + o.netCents, 0);

    const cards = [
        { label: 'À expédier', value: String(toShip), icon: Package, hint: 'commandes payées' },
        { label: 'En transit', value: String(inTransit), icon: Truck, hint: 'colis chez le transporteur' },
        { label: 'Retours', value: String(pendingReturns), icon: RotateCcw, hint: 'en attente de votre décision' },
        {
            label: 'Fonds retenus',
            value: formatPriceCents(heldCents, 'EUR'),
            icon: PackageCheck,
            hint: 'versés à la livraison',
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {cards.map((card) => (
                <StatCard key={card.label} {...card} />
            ))}
        </div>
    );
}
