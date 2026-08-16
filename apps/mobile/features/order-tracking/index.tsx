'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Clock,
    ExternalLink,
    Loader2,
    LogIn,
    MapPin,
    MessageSquare,
    PackageCheck,
    Shirt,
    Truck,
    Undo2,
    XCircle,
} from 'lucide-react';
import type { OrderDetail } from '@lumiris/api-client';
import { ORDER_STATUS_LABEL_BUYER } from '@lumiris/api-client';
import {
    useCancelOrder,
    useConfirmDelivery,
    useOpenDispute,
    useOrderDetail,
    usePostOrderMessage,
    useRequestReturn,
} from '@lumiris/api-client/react';
import { routes } from '@/lib/routes';
import { useUser } from '@/lib/auth/use-user';
import { formatCents } from '@/lib/marketplace';
import { GlassCard, IridescentBackground, slideUpFade } from '@/lib/motion';
import { toast } from '@/lib/toast';
import { OrderTimeline, TrackingSteps } from './timeline';
import { ReasonSheet } from './reason-sheet';

const RETURN_REASONS = [
    'La taille ne convient pas',
    'La pièce ne correspond pas à l’annonce',
    'Article abîmé à la réception',
    'Je change d’avis (rétractation)',
] as const;

const CANCEL_REASONS = [
    'Je me suis trompé de taille',
    'Je n’en ai plus besoin',
    'J’ai trouvé une autre pièce',
    'Délai de préparation trop long',
] as const;

type SheetKind = 'return' | 'dispute' | 'message' | 'cancel';

export function OrderTracking() {
    // useSearchParams (identifiant de commande en query string) impose une frontière Suspense.
    return (
        <Suspense fallback={<CenteredSpinner label="Chargement du suivi…" />}>
            <OrderTrackingInner />
        </Suspense>
    );
}

function OrderTrackingInner() {
    const { isAuthenticated } = useUser();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('id');
    const [sheet, setSheet] = useState<SheetKind | null>(null);

    const { data, isLoading, error } = useOrderDetail(orderId, { enabled: isAuthenticated && Boolean(orderId) });

    const confirmDelivery = useConfirmDelivery();
    const requestReturn = useRequestReturn();
    const openDispute = useOpenDispute();
    const postMessage = usePostOrderMessage();
    const cancelOrder = useCancelOrder();

    if (!isAuthenticated) {
        return (
            <CenteredMessage
                title="Connecte-toi pour suivre ta commande"
                action={{
                    label: 'Se connecter',
                    href: `/auth/sign-in?returnTo=${encodeURIComponent(routes.orderTracking(orderId ?? ''))}`,
                }}
            />
        );
    }

    if (isLoading) {
        return <CenteredSpinner label="Chargement du suivi…" />;
    }

    if (error || !data) {
        return <CenteredMessage title="Commande introuvable" action={{ label: 'Mes commandes', href: '/me/orders' }} />;
    }

    const { order } = data;
    const submitting =
        requestReturn.isPending ||
        openDispute.isPending ||
        postMessage.isPending ||
        cancelOrder.isPending ||
        confirmDelivery.isPending;

    const submitReason = (reason: string, fileIds: string[]) => {
        if (!orderId) return;
        const vars = { orderId, input: { reason, fileIds } };
        const done = (message: string) => () => {
            toast(message);
            setSheet(null);
        };
        const failed = (e: Error) => toast(e.message || 'Action impossible pour le moment.');

        if (sheet === 'return') {
            requestReturn.mutate(vars, { onSuccess: done('Demande de retour envoyée à l’atelier.'), onError: failed });
            return;
        }
        if (sheet === 'dispute') {
            openDispute.mutate(vars, { onSuccess: done('Litige ouvert — Lumiris suit le dossier.'), onError: failed });
            return;
        }
        if (sheet === 'cancel') {
            cancelOrder.mutate(vars, {
                onSuccess: done('Commande annulée — tu es intégralement remboursé.'),
                onError: failed,
            });
            return;
        }
        postMessage.mutate(vars, { onSuccess: done('Message envoyé à l’atelier.'), onError: failed });
    };

    return (
        <div className="relative flex h-full flex-col overflow-y-auto pb-28">
            <IridescentBackground intensity="subtle" />

            <motion.header
                className="px-5 pt-[max(env(safe-area-inset-top),3rem)] pb-4"
                variants={slideUpFade}
                initial="initial"
                animate="animate"
            >
                <Link
                    href="/me/orders"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Mes commandes
                </Link>
                <div className="mt-3 flex items-start gap-3">
                    <ProductThumb photoUrl={order.productPhotoUrl} name={order.productName} />
                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-lg font-bold text-foreground">
                            {order.productName ?? 'Ta commande'}
                            {order.variantLabel ? (
                                <span className="font-normal text-muted-foreground"> · {order.variantLabel}</span>
                            ) : null}
                        </h1>
                        <p className="text-xs text-muted-foreground">{order.sellerName ?? 'Atelier Lumiris'}</p>
                        <p className="mt-1 text-sm font-semibold text-lumiris-cyan">
                            {ORDER_STATUS_LABEL_BUYER[order.status]}
                        </p>
                    </div>
                </div>
            </motion.header>

            <div className="flex flex-col gap-3 px-4">
                {order.disputeStatus === 'OPEN' ? <DisputeCard detail={data} /> : null}
                <ReturnInstructions detail={data} />

                <GlassCard className="p-4" intensity="subtle">
                    <TrackingSteps status={order.status} />
                </GlassCard>

                {order.status === 'PAID' && order.shipDueAt ? <PreparationCard shipDueAt={order.shipDueAt} /> : null}

                {order.trackingNumber ? <TrackingCard detail={data} /> : null}

                <BuyerActions
                    detail={data}
                    submitting={submitting}
                    onConfirmDelivery={() =>
                        orderId &&
                        confirmDelivery.mutate(
                            { orderId, input: undefined },
                            {
                                onSuccess: () => toast('Réception confirmée — merci, l’atelier est réglé.'),
                                onError: (e) => toast(e.message || 'Action impossible pour le moment.'),
                            },
                        )
                    }
                    onOpenSheet={setSheet}
                />

                <AmountsCard detail={data} />
                {data.shipTo ? <AddressCard detail={data} /> : null}

                <GlassCard className="p-4" intensity="subtle">
                    <h2 className="mb-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Historique
                    </h2>
                    <OrderTimeline events={data.timeline} />
                </GlassCard>
            </div>

            <ReasonSheet
                open={sheet === 'return'}
                title="Demander un retour"
                description="L’atelier reçoit ta demande et te répond. Le remboursement suit la réception de la pièce."
                placeholder="Explique ce qui ne va pas…"
                suggestions={RETURN_REASONS}
                submitLabel="Envoyer la demande"
                pending={submitting}
                withAttachments
                onSubmit={submitReason}
                onClose={() => setSheet(null)}
            />
            <ReasonSheet
                open={sheet === 'dispute'}
                title="Ouvrir un litige"
                description="À utiliser si le dialogue avec l’atelier n’aboutit pas. Lumiris arbitre et peut rembourser."
                placeholder="Décris précisément le problème et ce que tu attends…"
                submitLabel="Ouvrir le litige"
                pending={submitting}
                withAttachments
                onSubmit={submitReason}
                onClose={() => setSheet(null)}
            />
            <ReasonSheet
                open={sheet === 'message'}
                title="Écrire à l’atelier"
                description="Ton message part directement à l’artisan et reste attaché à cette commande."
                placeholder="Une question sur la taille, le délai, l’emballage…"
                submitLabel="Envoyer"
                pending={submitting}
                withAttachments
                onSubmit={submitReason}
                onClose={() => setSheet(null)}
            />
            <ReasonSheet
                open={sheet === 'cancel'}
                title="Annuler ma commande"
                description="Rien n’est encore parti : tu es remboursé intégralement et la pièce retourne en boutique."
                placeholder="Dis à l’atelier ce qui t’a fait changer d’avis…"
                suggestions={CANCEL_REASONS}
                submitLabel="Confirmer l’annulation"
                pending={submitting}
                onSubmit={submitReason}
                onClose={() => setSheet(null)}
            />
        </div>
    );
}

// N'affiche que les actions réellement acceptées par le serveur (drapeaux `can*`) : un bouton
// proposé ici aboutit toujours, plutôt que de renvoyer une erreur après le tap.
function BuyerActions({
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
                        onClick={() => onOpenSheet('cancel')}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-lumiris-rose"
                    >
                        <XCircle className="h-3.5 w-3.5" />
                        Annuler ma commande
                    </button>
                </div>
            ) : null}

            <div className="flex gap-2">
                {/* Écrire à l'atelier reste possible à tout moment : une question ne doit pas
                    obliger à ouvrir un litige. */}
                <button
                    type="button"
                    onClick={() => onOpenSheet('message')}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border py-2.5 text-xs font-semibold text-foreground"
                >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Écrire à l’atelier
                </button>
                {order.canRequestReturn ? (
                    <button
                        type="button"
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
                    Retour possible jusqu’au {formatDate(order.returnDeadline)}.
                </p>
            ) : null}
        </div>
    );
}

// Un retour accepté n'a de valeur que si l'acheteur sait où renvoyer la pièce ; un retour refusé,
// que s'il connaît le motif. C'est la réponse de l'atelier, mise là où on la cherche.
function ReturnInstructions({ detail }: { detail: OrderDetail }) {
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
                    ? 'Le remboursement part dès que l’atelier réceptionne le colis.'
                    : 'Si tu contestes cette décision, tu peux signaler un problème : Lumiris arbitrera.'}
            </p>
        </div>
    );
}

// Le trou visuel de la fenêtre « payée, pas encore expédiée » : sans cette carte, l'acheteur d'une
// pièce fabriquée à la commande ne voit rien bouger et finit par écrire, voire ouvrir un litige.
function PreparationCard({ shipDueAt }: { shipDueAt: string }) {
    return (
        <GlassCard className="p-4" intensity="subtle">
            <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} aria-hidden />
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">En préparation à l&apos;atelier</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                        L&apos;atelier s&apos;est engagé à expédier ta pièce au plus tard le {formatDate(shipDueAt)}. Tu
                        recevras le suivi dès que le colis part.
                    </p>
                </div>
            </div>
        </GlassCard>
    );
}

function TrackingCard({ detail }: { detail: OrderDetail }) {
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
            {order.shippedAt ? (
                <p className="text-[11px] text-muted-foreground">Expédié le {formatDate(order.shippedAt)}</p>
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

function DisputeCard({ detail }: { detail: OrderDetail }) {
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

function AmountsCard({ detail }: { detail: OrderDetail }) {
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

function AddressCard({ detail }: { detail: OrderDetail }) {
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

function ProductThumb({ photoUrl, name }: { photoUrl?: string | null; name?: string | null }) {
    return (
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted">
            {photoUrl ? (
                <Image src={photoUrl} alt={name ?? ''} fill sizes="56px" className="object-cover" unoptimized />
            ) : (
                <Shirt className="h-6 w-6 text-muted-foreground/30" strokeWidth={1.5} aria-hidden />
            )}
        </div>
    );
}

function formatDate(iso?: string | null): string {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(date);
}

function CenteredSpinner({ label }: { label: string }) {
    return (
        <div className="flex h-full items-center justify-center gap-2 bg-background text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {label}
        </div>
    );
}

function CenteredMessage({ title, action }: { title: string; action: { label: string; href: string } }) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-background px-8 text-center">
            <p className="text-base font-semibold text-foreground">{title}</p>
            <Link
                href={action.href}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
                <LogIn className="h-4 w-4" />
                {action.label}
            </Link>
        </div>
    );
}
