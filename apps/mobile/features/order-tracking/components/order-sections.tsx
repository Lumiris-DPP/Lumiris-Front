'use client';

import Link from '@/components/navigation-link';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    ExternalLink,
    Loader2,
    MapPin,
    MessageSquare,
    PackageCheck,
    Radio,
    Truck,
    Undo2,
    XCircle,
} from 'lucide-react';
import type { OrderDetail } from '@lumiris/api-client';
import { TRACKING_STATUS_LABEL } from '@lumiris/api-client';
import { routes } from '@/lib/routes';
import { formatCents } from '@/lib/marketplace/money';
import { GlassCard } from '@/lib/motion/index';
import { formatDayMonthFr } from '@lumiris/utils';
import type { SheetKind } from '../models/tracking-model';

// Affiche les actions autorisées pour l’acheteur.
export function BuyerActions({
    detail,
    submitting,
    onConfirmDelivery,
    onOpenSheet,
}: {
    detail: OrderDetail;
    submitting: boolean;
    onConfirmDelivery: () => void;
    onOpenSheet: (kind: SheetKind) => void;
}) {
    const { order } = detail;
    const disputeOpen = order.disputeStatus === 'OPEN';

    return (
        <div className="flex flex-col gap-2">
            {order.canConfirmDelivery ? (
                <button
                    type="button"
                    disabled={submitting}
                    onClick={onConfirmDelivery}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
                >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    J’ai bien reçu ma commande
                </button>
            ) : null}

            {order.canCancel ? (
                <div className="rounded-2xl border border-border/60 bg-card p-3">
                    <p className="text-xs text-muted-foreground">
                        L’atelier n’a pas encore expédié : tu peux encore annuler et être remboursé intégralement.
                    </p>
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={() => onOpenSheet('cancel')}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-lumiris-rose"
                    >
                        <XCircle className="h-3.5 w-3.5" />
                        Annuler ma commande
                    </button>
                </div>
            ) : null}

            <div className="flex gap-2">
                <button
                    type="button"
                    disabled={submitting}
                    onClick={() => onOpenSheet('message')}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border py-2.5 text-xs font-semibold text-foreground"
                >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Écrire à l’atelier
                </button>
                {order.canRequestReturn ? (
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={() => onOpenSheet('return')}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border py-2.5 text-xs font-semibold text-foreground"
                    >
                        <Undo2 className="h-3.5 w-3.5" />
                        Demander un retour
                    </button>
                ) : null}
                {!disputeOpen && order.canOpenDispute ? (
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={() => onOpenSheet('dispute')}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border py-2.5 text-xs font-semibold text-muted-foreground"
                    >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Signaler un problème
                    </button>
                ) : null}
            </div>

            {order.returnDeadline && order.canRequestReturn ? (
                <p className="text-center text-[11px] text-muted-foreground">
                    Retour possible jusqu’au {formatDayMonthFr(order.returnDeadline) ?? ''}.
                </p>
            ) : null}
        </div>
    );
}

// Affiche les consignes de retour de l’atelier.
export function ReturnInstructions({ detail }: { detail: OrderDetail }) {
    const { order } = detail;
    const approved = order.status === 'RETURN_APPROVED';
    const refused = order.status === 'RETURN_REFUSED';
    if (!approved && !refused) {
        return null;
    }

    return (
        <div
            className={`rounded-2xl border p-4 ${
                approved ? 'border-lumiris-cyan/30 bg-lumiris-cyan/5' : 'border-lumiris-amber/30 bg-lumiris-amber/10'
            }`}
        >
            <div className="flex items-center gap-2">
                <Undo2 className={`h-4 w-4 ${approved ? 'text-lumiris-cyan' : 'text-lumiris-amber'}`} aria-hidden />
                <h2 className="text-sm font-semibold text-foreground">
                    {approved ? 'Retour accepté — à renvoyer' : 'Retour refusé par l’atelier'}
                </h2>
            </div>
            {detail.returnDecisionNote ? (
                <p className="mt-1.5 text-xs leading-relaxed whitespace-pre-line text-foreground/90">
                    {detail.returnDecisionNote}
                </p>
            ) : (
                <p className="mt-1.5 text-xs text-muted-foreground">
                    {approved
                        ? 'L’atelier n’a pas précisé d’adresse de retour — écris-lui pour l’obtenir.'
                        : 'Aucun motif précisé.'}
                </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
                {approved
                    ? 'L’atelier pourra te rembourser après réception du colis.'
                    : 'Si tu contestes cette décision, tu peux signaler un problème : Lumiris arbitrera.'}
            </p>
        </div>
    );
}

// Affiche la date d’expédition prévue par l’atelier.
export function PreparationCard({ shipDueAt }: { shipDueAt: string }) {
    return (
        <GlassCard className="p-4" intensity="subtle">
            <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} aria-hidden />
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">En préparation à l&apos;atelier</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                        L&apos;atelier s&apos;est engagé à expédier ta pièce au plus tard le{' '}
                        {formatDayMonthFr(shipDueAt) ?? ''}. Tu recevras le suivi dès que le colis part.
                    </p>
                </div>
            </div>
        </GlassCard>
    );
}

// Affiche le suivi du colis et ses dernières dates.
export function TrackingCard({ detail }: { detail: OrderDetail }) {
    const { order } = detail;
    return (
        <GlassCard className="p-4" intensity="subtle">
            <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" aria-hidden />
                <h2 className="text-sm font-semibold text-foreground">Suivi du colis</h2>
            </div>
            <p className="mt-2 text-sm text-foreground">
                {order.carrier} · <span className="font-mono text-xs">{order.trackingNumber}</span>
            </p>

            {order.trackingStatus ? (
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-lumiris-cyan">
                    <Radio className="h-3.5 w-3.5" aria-hidden />
                    {order.trackingStatusLabel ?? TRACKING_STATUS_LABEL[order.trackingStatus]}
                    {order.trackingUpdatedAt ? (
                        <span className="font-normal text-muted-foreground">
                            · {formatDayMonthFr(order.trackingUpdatedAt) ?? ''}
                        </span>
                    ) : null}
                </p>
            ) : null}
            {order.shippedAt ? (
                <p className="text-[11px] text-muted-foreground">
                    Expédié le {formatDayMonthFr(order.shippedAt) ?? ''}
                </p>
            ) : null}
            {order.trackingUrl ? (
                <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground"
                >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Suivre chez {order.carrier}
                </a>
            ) : null}
        </GlassCard>
    );
}

// Affiche le litige en cours et son état.
export function DisputeCard({ detail }: { detail: OrderDetail }) {
    return (
        <div className="rounded-2xl border border-lumiris-amber/30 bg-lumiris-amber/10 p-4">
            <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-lumiris-amber" aria-hidden />
                <h2 className="text-sm font-semibold text-foreground">Litige en cours</h2>
            </div>
            {detail.disputeReason ? (
                <p className="mt-1.5 text-xs text-muted-foreground">{detail.disputeReason}</p>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground">
                Lumiris suit le dossier et tranche si aucun accord n’est trouvé avec l’atelier.
            </p>
        </div>
    );
}

// Affiche les montants payés et remboursés de la commande.
export function AmountsCard({ detail }: { detail: OrderDetail }) {
    const { order } = detail;
    const shipping = order.shippingCents ?? 0;
    const refunded = order.refundedCents ?? 0;
    return (
        <GlassCard className="p-4" intensity="subtle">
            <h2 className="mb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Montants</h2>
            <dl className="flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                        Pièce{order.quantity && order.quantity > 1 ? ` ×${order.quantity}` : ''}
                    </dt>
                    <dd className="text-foreground tabular-nums">{formatCents(order.amountTotalCents)}</dd>
                </div>
                <div className="flex justify-between">
                    <dt className="text-muted-foreground">Livraison</dt>
                    <dd className="text-foreground tabular-nums">
                        {shipping === 0 ? 'Offerte' : formatCents(shipping)}
                    </dd>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-1.5 font-semibold">
                    <dt className="text-foreground">Payé</dt>
                    <dd className="text-foreground tabular-nums">{formatCents(order.amountTotalCents + shipping)}</dd>
                </div>
                {refunded > 0 ? (
                    <div className="flex justify-between text-lumiris-emerald">
                        <dt>Remboursé</dt>
                        <dd className="tabular-nums">{formatCents(refunded)}</dd>
                    </div>
                ) : null}
            </dl>
            {order.invoiceNumber && order.paymentIntentId ? (
                <Link
                    href={routes.orderInvoice(order.paymentIntentId)}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-lumiris-cyan"
                >
                    <PackageCheck className="h-3.5 w-3.5" />
                    Facture {order.invoiceNumber}
                </Link>
            ) : null}
        </GlassCard>
    );
}

// Affiche l’adresse de livraison de l’acheteur.
export function AddressCard({ detail }: { detail: OrderDetail }) {
    const shipTo = detail.shipTo;
    if (!shipTo) return null;
    return (
        <GlassCard className="p-4" intensity="subtle">
            <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />
                <h2 className="text-sm font-semibold text-foreground">Livrée à</h2>
            </div>
            <address className="mt-1.5 text-xs text-muted-foreground not-italic">
                {shipTo.fullName}
                <br />
                {shipTo.line1}
                {shipTo.line2 ? `, ${shipTo.line2}` : ''}
                <br />
                {shipTo.postalCode} {shipTo.city}
            </address>
        </GlassCard>
    );
}
