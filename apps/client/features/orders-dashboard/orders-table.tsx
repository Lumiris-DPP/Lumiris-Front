'use client';

import { ChevronRight, MapPin } from 'lucide-react';
import type { SellerOrder } from '@lumiris/api-client';
import { Button } from '@lumiris/ui/components/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { formatDateFr, formatPriceCents } from '@lumiris/utils';
import { OrderStatusBadge } from './status-badge';

// Une seule table pour les cinq onglets : ils décrivent le même objet à des moments différents,
// pas cinq objets différents. Le détail et les actions vivent dans la feuille latérale.
export function OrdersTable({
    orders,
    onSelect,
}: {
    orders: readonly SellerOrder[];
    onSelect: (order: SellerOrder) => void;
}) {
    return (
        <div className="overflow-hidden rounded-xl border border-border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Pièce</TableHead>
                        <TableHead>Acheteur</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Net atelier</TableHead>
                        <TableHead>Commandée le</TableHead>
                        <TableHead className="w-10" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => (
                        <TableRow
                            key={order.id}
                            className="cursor-pointer"
                            onClick={() => onSelect(order)}
                            aria-label={`Ouvrir la commande ${order.productName ?? ''}`}
                        >
                            <TableCell className="font-medium text-foreground">
                                {order.productName ?? 'Pièce'}
                                {order.quantity && order.quantity > 1 ? (
                                    <span className="text-muted-foreground"> ×{order.quantity}</span>
                                ) : null}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                <span className="block">{order.buyerName ?? '—'}</span>
                                {order.shipTo?.city ? (
                                    <span className="flex items-center gap-1 text-[11px]">
                                        <MapPin className="h-3 w-3" aria-hidden />
                                        {order.shipTo.postalCode} {order.shipTo.city}
                                    </span>
                                ) : null}
                            </TableCell>
                            <TableCell>
                                <OrderStatusBadge status={order.status} disputeStatus={order.disputeStatus} />
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                                {formatPriceCents(order.netCents, order.currency ?? 'EUR')}
                                <span className="block text-[11px] text-muted-foreground">
                                    {order.released ? 'versé' : 'retenu'}
                                </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{formatDateFr(order.createdAt)}</TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon" aria-label="Voir le détail" tabIndex={-1}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
