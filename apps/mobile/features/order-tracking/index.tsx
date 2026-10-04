'use client';

import { Suspense } from 'react';
import Link from '@/components/navigation-link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, LogIn, Shirt } from 'lucide-react';
import { ORDER_STATUS_LABEL_BUYER } from '@lumiris/api-client';
import { routes } from '@/lib/routes';
import { useUser } from '@/lib/auth/use-user';
import { GlassCard, IridescentBackground, slideUpFade } from '@/lib/motion';
import { OrderTimeline, TrackingSteps } from './components/timeline';
import { ReasonSheet } from './components/reason-sheet';
import { useOrderTracking } from './hooks/use-order-tracking';
import {
    AmountsCard,
    AddressCard,
    BuyerActions,
    DisputeCard,
    PreparationCard,
    ReturnInstructions,
    TrackingCard,
} from './components/order-sections';
import { isOrderNotFound } from './models/tracking-model';

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

// Affiche le suivi de commande sous une attente de navigation.
export function OrderTracking() {
    return (
        <Suspense fallback={<CenteredSpinner label="Chargement du suivi…" />}>
            <OrderTrackingInner />
        </Suspense>
    );
}

// Lit l’identifiant de commande dans l’adresse de navigation.
function OrderTrackingInner() {
    const orderId = useSearchParams().get('id');
    return <OrderTrackingContent key={orderId ?? ''} orderId={orderId} />;
}

// Affiche le détail du suivi ou son état de chargement.
function OrderTrackingContent({ orderId }: { orderId: string | null }) {
    const { isAuthenticated } = useUser();
    const { data, isLoading, error, refetch, sheet, setSheet, submitting, submitReason, confirmReception } =
        useOrderTracking(orderId, isAuthenticated);

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

    if (!orderId || isOrderNotFound(error)) {
        return <CenteredMessage title="Commande introuvable" action={{ label: 'Mes commandes', href: '/me/orders' }} />;
    }

    if (error || !data) {
        return (
            <div
                className="flex h-full flex-col items-center justify-center gap-4 bg-background px-8 text-center"
                role="alert"
            >
                <p className="font-semibold">Impossible de charger le suivi</p>
                <button
                    type="button"
                    onClick={() => void refetch()}
                    className="rounded-full border border-border px-4 py-2"
                >
                    Réessayer
                </button>
            </div>
        );
    }

    const { order } = data;

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
                    onConfirmDelivery={confirmReception}
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

// Affiche la photo du produit ou son image de remplacement.
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

// Affiche un indicateur de chargement centré.
function CenteredSpinner({ label }: { label: string }) {
    return (
        <div className="flex h-full items-center justify-center gap-2 bg-background text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {label}
        </div>
    );
}

// Affiche un message centré avec les actions proposées.
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
