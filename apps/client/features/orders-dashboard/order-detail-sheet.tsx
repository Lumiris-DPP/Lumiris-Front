'use client';

import { useState } from 'react';
import { ExternalLink, Loader2, MessageSquare, PackageCheck, Send, Truck, Undo2, XCircle } from 'lucide-react';
import type { SellerOrder } from '@lumiris/api-client';
import { useCancelSellerOrder, useMarkReturnReceived, usePostSellerMessage } from '@lumiris/api-client/react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@lumiris/ui/components/alert-dialog';
import { Button } from '@lumiris/ui/components/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@lumiris/ui/components/sheet';
import { Separator } from '@lumiris/ui/components/separator';
import { Textarea } from '@lumiris/ui/components/textarea';
import { toast } from '@lumiris/ui/components/sonner';
import { formatDateFr, formatPriceCents } from '@lumiris/utils';
import { DisputeBanner } from './dispute-banner';
import { OrderStatusBadge } from './status-badge';
import { OrderTimeline } from './order-timeline';
import { RefundDialog } from './refund-dialog';
import { ReturnDecisionDialog } from './return-decision-dialog';
import { ShipDialog } from './ship-dialog';

// Détail d'une commande et toutes ses actions au même endroit : le vendeur décide sur pièce
// (adresse, motif du retour, historique) sans changer d'écran.
export function OrderDetailSheet({ order, onClose }: { order: SellerOrder | null; onClose: () => void }) {
    const [shipOpen, setShipOpen] = useState(false);
    const [refundOpen, setRefundOpen] = useState(false);
    const [returnOpen, setReturnOpen] = useState(false);

    return (
        <Sheet open={Boolean(order)} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
                {order ? (
                    <>
                        <SheetHeader>
                            <SheetTitle className="pr-8">{order.productName ?? 'Commande'}</SheetTitle>
                            <SheetDescription>
                                Commandée le {formatDateFr(order.createdAt)}
                                {order.invoiceNumber ? ` · facture ${order.invoiceNumber}` : ''}
                            </SheetDescription>
                            <div className="pt-1">
                                <OrderStatusBadge status={order.status} disputeStatus={order.disputeStatus} />
                            </div>
                        </SheetHeader>

                        <div className="space-y-5 px-4 pb-8">
                            {order.disputeStatus === 'OPEN' ? <DisputeBanner reason={order.disputeReason} /> : null}

                            <OrderActions
                                order={order}
                                onShip={() => setShipOpen(true)}
                                onRefund={() => setRefundOpen(true)}
                                onDecideReturn={() => setReturnOpen(true)}
                            />

                            <Separator />
                            <MoneySection order={order} />

                            <Separator />
                            <AddressSection order={order} />

                            {order.trackingNumber ? (
                                <>
                                    <Separator />
                                    <TrackingSection order={order} />
                                </>
                            ) : null}

                            <Separator />
                            <MessageComposer orderId={order.id} disputeOpen={order.disputeStatus === 'OPEN'} />

                            <Separator />
                            <section>
                                <h3 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Historique
                                </h3>
                                <OrderTimeline events={order.timeline} />
                            </section>
                        </div>

                        <ShipDialog order={order} open={shipOpen} onOpenChange={setShipOpen} />
                        <RefundDialog order={order} open={refundOpen} onOpenChange={setRefundOpen} />
                        <ReturnDecisionDialog order={order} open={returnOpen} onOpenChange={setReturnOpen} />
                    </>
                ) : null}
            </SheetContent>
        </Sheet>
    );
}

// N'affiche que les transitions réellement acceptées par le serveur (drapeaux `can*`) : un
// bouton visible ici aboutit toujours.
function OrderActions({
    order,
    onShip,
    onRefund,
    onDecideReturn,
}: {
    order: SellerOrder;
    onShip: () => void;
    onRefund: () => void;
    onDecideReturn: () => void;
}) {
    const receivedMutation = useMarkReturnReceived();
    const hasAction =
        order.canShip || order.canDecideReturn || order.canMarkReturnReceived || order.canRefund || order.canCancel;
    if (!hasAction) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {order.canShip && (
                <Button onClick={onShip} className="gap-1.5 bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90">
                    <Truck className="h-4 w-4" /> Saisir le suivi et expédier
                </Button>
            )}
            {order.canDecideReturn && (
                <Button onClick={onDecideReturn} variant="outline" className="gap-1.5">
                    <Undo2 className="h-4 w-4" /> Traiter la demande de retour
                </Button>
            )}
            {order.canMarkReturnReceived && (
                <Button
                    variant="outline"
                    className="gap-1.5"
                    disabled={receivedMutation.isPending}
                    onClick={() =>
                        receivedMutation.mutate(
                            { orderId: order.id, input: undefined },
                            {
                                onSuccess: () => toast.success('Retour réceptionné — pensez à rembourser l’acheteur.'),
                                onError: (e) => toast.error(e.message || 'Action impossible.'),
                            },
                        )
                    }
                >
                    {receivedMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <PackageCheck className="h-4 w-4" />
                    )}
                    J’ai reçu le retour
                </Button>
            )}
            {order.canRefund && (
                <Button onClick={onRefund} variant="ghost" className="gap-1.5 text-destructive">
                    <Undo2 className="h-4 w-4" /> Rembourser
                </Button>
            )}
            {order.canCancel && <CancelOrderButton order={order} />}
        </div>
    );
}

// Rupture de stock, pièce abîmée à la préparation : le vendeur doit pouvoir renoncer sans laisser
// l'acheteur attendre un colis qui ne partira jamais. Remboursement intégral, pièce remise au
// catalogue. Irréversible, donc confirmé.
function CancelOrderButton({ order }: { order: SellerOrder }) {
    const [open, setOpen] = useState(false);
    const cancelMutation = useCancelSellerOrder();

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" className="gap-1.5 text-muted-foreground">
                    <XCircle className="h-4 w-4" /> Annuler la commande
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Annuler « {order.productName} » ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        L’acheteur est intégralement remboursé et prévenu ; la pièce retourne à votre catalogue. Cette
                        action est définitive.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Revenir</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={cancelMutation.isPending}
                        onClick={() =>
                            cancelMutation.mutate(
                                {
                                    orderId: order.id,
                                    input: { reason: 'L’atelier ne peut pas honorer cette commande.' },
                                },
                                {
                                    onSuccess: () => toast.success('Commande annulée et acheteur remboursé.'),
                                    onError: (e) => toast.error(e.message || 'Annulation impossible.'),
                                },
                            )
                        }
                    >
                        {cancelMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                        Annuler et rembourser
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function MoneySection({ order }: { order: SellerOrder }) {
    const currency = order.currency ?? 'EUR';
    const rows = [
        {
            label: `Pièce${order.quantity && order.quantity > 1 ? ` ×${order.quantity}` : ''}`,
            value: order.amountTotalCents,
        },
        { label: 'Livraison facturée', value: order.shippingCents ?? 0 },
        { label: 'Commission Lumiris', value: -order.commissionCents },
    ];

    return (
        <section>
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Montants</h3>
            <dl className="space-y-1.5 text-sm">
                {rows.map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="tabular-nums">{formatPriceCents(value, currency)}</dd>
                    </div>
                ))}
                <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
                    <dt>Net atelier</dt>
                    <dd className="tabular-nums">{formatPriceCents(order.netCents, currency)}</dd>
                </div>
                {order.refundedCents ? (
                    <div className="flex justify-between text-destructive">
                        <dt>Remboursé à l’acheteur</dt>
                        <dd className="tabular-nums">−{formatPriceCents(order.refundedCents, currency)}</dd>
                    </div>
                ) : null}
            </dl>
            <p className="mt-2 text-[11px] text-muted-foreground">
                {order.released
                    ? `Fonds versés le ${formatDateFr(order.releasedAt)}.`
                    : 'Fonds retenus par Lumiris jusqu’à la livraison — ils partent automatiquement ensuite.'}
            </p>
        </section>
    );
}

function AddressSection({ order }: { order: SellerOrder }) {
    return (
        <section>
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Adresse de livraison
            </h3>
            {order.shipTo ? (
                <address className="text-sm text-foreground not-italic">
                    {order.shipTo.fullName}
                    <br />
                    {order.shipTo.line1}
                    {order.shipTo.line2 ? (
                        <>
                            <br />
                            {order.shipTo.line2}
                        </>
                    ) : null}
                    <br />
                    {order.shipTo.postalCode} {order.shipTo.city}, {order.shipTo.country}
                    {order.shipTo.phone ? (
                        <>
                            <br />
                            {order.shipTo.phone}
                        </>
                    ) : null}
                </address>
            ) : (
                <p className="text-sm text-muted-foreground">Aucune adresse transmise pour cette commande.</p>
            )}
        </section>
    );
}

function TrackingSection({ order }: { order: SellerOrder }) {
    return (
        <section>
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Expédition</h3>
            <p className="text-sm text-foreground">
                {order.carrier} · <span className="font-mono">{order.trackingNumber}</span>
            </p>
            <p className="text-[11px] text-muted-foreground">Expédiée le {formatDateFr(order.shippedAt)}</p>
            {order.trackingUrl ? (
                <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-lumiris-cyan hover:underline"
                >
                    <ExternalLink className="h-3.5 w-3.5" /> Suivre le colis
                </a>
            ) : null}
        </section>
    );
}

// Fil de conversation avec l'acheteur, toujours disponible : la plupart des incidents se règlent
// par un message avant de devenir un retour ou un litige.
function MessageComposer({ orderId, disputeOpen }: { orderId: string; disputeOpen: boolean }) {
    const [message, setMessage] = useState('');
    const postMessage = usePostSellerMessage();

    const send = () => {
        if (message.trim().length < 3 || postMessage.isPending) return;
        postMessage.mutate(
            { orderId, input: { reason: message.trim() } },
            {
                onSuccess: () => {
                    toast.success('Message envoyé à l’acheteur.');
                    setMessage('');
                },
                onError: (e: Error) => toast.error(e.message || 'Envoi impossible.'),
            },
        );
    };

    return (
        <section>
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                <MessageSquare className="h-3.5 w-3.5" />
                {disputeOpen ? 'Répondre au litige' : 'Écrire à l’acheteur'}
            </h3>
            <Textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                    disputeOpen
                        ? 'Votre version des faits, preuves d’expédition, proposition d’arrangement…'
                        : 'Délai de préparation, précision sur la pièce, adresse de retour…'
                }
            />
            <Button
                size="sm"
                className="mt-2 gap-1.5"
                disabled={message.trim().length < 3 || postMessage.isPending}
                onClick={send}
            >
                {postMessage.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <Send className="h-3.5 w-3.5" />
                )}
                Envoyer
            </Button>
        </section>
    );
}
