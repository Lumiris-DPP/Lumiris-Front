'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    CheckCircle2,
    ChevronRight,
    Clock,
    FileText,
    Loader2,
    LogIn,
    Mail,
    RotateCcw,
    ShieldCheck,
    Sparkles,
    Truck,
} from 'lucide-react';
import { useMyOrders, useOrderGroup, useWardrobe } from '@lumiris/api-client/react';
import { cn } from '@lumiris/ui/lib/cn';
import { routes } from '@/lib/routes';
import { useUser } from '@/lib/auth/use-user';
import { clearCart, formatCents } from '@/lib/marketplace';

// Retour au récapitulatif après connexion (invité arrivé sur la confirmation sans session).
const CONFIRM_RETURN = encodeURIComponent(routes.order('latest'));
// Cadence de poll + borne dure : au-delà, on cesse d'attendre le webhook Stripe.
const POLL_INTERVAL_MS = 1500;
const POLL_MAX_MS = 30_000;

export function OrderConfirmation({ routeId }: { routeId: string }) {
    // useSearchParams (retour de redirection Stripe) impose une frontière Suspense.
    return (
        <Suspense fallback={<CenteredSpinner label="Récupération de ta commande…" />}>
            <OrderConfirmationInner routeId={routeId} />
        </Suspense>
    );
}

function OrderConfirmationInner({ routeId }: { routeId: string }) {
    const { isAuthenticated } = useUser();
    const searchParams = useSearchParams();
    const [startedAt] = useState(() => Date.now());
    const [pollExpired, setPollExpired] = useState(false);

    // paymentIntentId cible : la query de retour de redirection Stripe (?payment_intent=…)
    // prime sur le segment d'URL ; « latest » signifie « à résoudre via la dernière commande ».
    const piFromQuery = searchParams.get('payment_intent');
    const explicitPi = piFromQuery ?? (routeId && routeId !== 'latest' ? routeId : null);

    // Filet de sécurité : vider le panier à l'arrivée (notamment après redirection 3-D Secure).
    useEffect(() => {
        clearCart();
    }, []);

    // Borne dure du polling : au-delà de ~30 s, on montre un repli plutôt qu'un spinner infini.
    useEffect(() => {
        if (!isAuthenticated) return;
        const timer = setTimeout(() => setPollExpired(true), POLL_MAX_MS);
        return () => clearTimeout(timer);
    }, [isAuthenticated]);

    // Repli « latest » : sans PaymentIntent explicite (lien legacy / retour sans query), on lit
    // la commande la plus récente pour en déduire son paymentIntentId.
    const { data: orders } = useMyOrders({
        enabled: isAuthenticated && !explicitPi,
        refetchInterval: (query) => {
            if (query.state.data?.[0]?.paymentIntentId) return false;
            if (Date.now() - startedAt > POLL_MAX_MS) return false;
            return POLL_INTERVAL_MS;
        },
    });
    const targetPi = explicitPi ?? orders?.[0]?.paymentIntentId ?? null;

    // Groupe de commande = toutes les lignes du paiement + total RÉELLEMENT facturé par Stripe.
    // Passe à PAID via le webhook → on poll jusqu'à résolution ou borne de temps atteinte.
    const { data: group, isLoading: groupLoading } = useOrderGroup(targetPi, {
        enabled: isAuthenticated && Boolean(targetPi),
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            if (status && status !== 'PENDING') return false;
            if (Date.now() - startedAt > POLL_MAX_MS) return false;
            return POLL_INTERVAL_MS;
        },
    });
    const { data: wardrobe = [] } = useWardrobe({ enabled: isAuthenticated });

    const settling = !group || group.status === 'PENDING';
    // Une commande remboursée ou annulée n'est plus une commande confirmée : sans ce cas, l'écran
    // continuait d'annoncer « Ta pièce a rejoint ta Garde-Robe » après un arbitrage et un
    // remboursement effectifs.
    const unwound = group?.status === 'REFUNDED' || group?.status === 'CANCELLED';
    // Nombre d'ateliers du panier : conditionne le nombre de colis annoncé à l'acheteur.
    const sellerCount = new Set((group?.lines ?? []).map((line) => line.sellerName ?? '')).size;
    const timedOut = pollExpired && settling;

    // (a) Invité : la commande n'est pas récupérable (query désactivée) → prompt de connexion
    // au lieu d'un spinner infini. Le paiement, lui, a bien été confirmé côté Stripe.
    if (!isAuthenticated) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-5 bg-background px-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lumiris-emerald/10 text-lumiris-emerald">
                    <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-foreground">Paiement reçu</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Connecte-toi pour retrouver ta commande, ta facture et ta pièce dans ta Garde-Robe.
                    </p>
                </div>
                <Link
                    href={`/auth/sign-in?returnTo=${CONFIRM_RETURN}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-primary-foreground"
                >
                    <LogIn className="h-4 w-4" />
                    Se connecter
                </Link>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col overflow-y-auto bg-background pb-28">
            <div className="flex flex-col items-center px-6 pt-16 text-center">
                <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    className={cn(
                        'flex h-20 w-20 items-center justify-center rounded-full',
                        unwound ? 'bg-muted text-muted-foreground' : 'bg-lumiris-emerald/10 text-lumiris-emerald',
                    )}
                >
                    {unwound ? <RotateCcw className="h-10 w-10" /> : <CheckCircle2 className="h-10 w-10" />}
                </motion.div>
                <motion.h1
                    className="mt-5 text-xl font-bold text-balance text-foreground"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    {unwound
                        ? group.status === 'REFUNDED'
                            ? 'Commande remboursée'
                            : 'Commande annulée'
                        : settling
                          ? timedOut
                              ? 'Paiement en cours de confirmation'
                              : 'Paiement reçu'
                          : 'Commande confirmée'}
                </motion.h1>
                {group?.invoiceNumber ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                        Facture <span className="font-mono text-foreground">{group.invoiceNumber}</span>
                    </p>
                ) : settling && !timedOut ? (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        {groupLoading || group ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        Validation de la commande en cours…
                    </p>
                ) : null}
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground/90">
                    <Mail className="h-3.5 w-3.5" aria-hidden />
                    {unwound
                        ? 'Le détail du remboursement t’a été envoyé par email.'
                        : 'Un reçu t’a été envoyé par email.'}
                </p>
            </div>

            {group ? (
                <div className="mt-8 flex flex-col gap-4 px-4">
                    <section className="opal-shadow rounded-2xl border border-border/60 bg-card p-4">
                        <h2 className="mb-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                            {group.lines.length > 1 ? `Articles (${group.lines.length})` : 'Article'}
                        </h2>
                        {/* Chaque ligne mène à son propre suivi : un panier multi-atelier donne
                            plusieurs colis, qui n'avancent pas au même rythme. */}
                        <ul className="flex flex-col gap-1">
                            {group.lines.map((line) => (
                                <li key={line.id}>
                                    <Link
                                        href={routes.orderTracking(line.id)}
                                        className="-mx-1 flex items-center justify-between gap-2 rounded-lg px-1 py-1.5 transition-colors hover:bg-muted/50"
                                    >
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium text-foreground">
                                                {line.productName ?? 'Pièce achetée'}
                                                {line.variantLabel ? ` (${line.variantLabel})` : ''}
                                            </span>
                                            {line.sellerName ? (
                                                <span className="block truncate text-[11px] text-muted-foreground">
                                                    {line.sellerName}
                                                </span>
                                            ) : null}
                                        </span>
                                        <span className="shrink-0 text-sm text-foreground tabular-nums">
                                            {formatCents(line.amountTotalCents)}
                                        </span>
                                        <ChevronRight
                                            className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60"
                                            aria-hidden
                                        />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <dl className="mt-3 flex flex-col gap-2 border-t border-border/60 pt-3 text-sm">
                            <div className="flex items-center justify-between">
                                <dt className="text-muted-foreground">Sous-total</dt>
                                <dd className="text-foreground tabular-nums">{formatCents(group.itemsTotalCents)}</dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt className="text-muted-foreground">Livraison</dt>
                                <dd className="text-foreground tabular-nums">
                                    {group.shippingCents === 0 ? 'Offerte' : formatCents(group.shippingCents)}
                                </dd>
                            </div>
                            <div className="mt-1 flex items-center justify-between border-t border-border/60 pt-2 font-semibold">
                                <dt className="text-foreground">
                                    {group.status === 'REFUNDED' ? 'Total remboursé' : 'Total payé'}
                                </dt>
                                <dd className="text-foreground tabular-nums">
                                    {formatCents(group.amountChargedCents)}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <section className="rounded-2xl border border-border/60 bg-card p-4">
                        <div className="flex items-center gap-2">
                            {unwound ? (
                                <RotateCcw className="h-4 w-4 text-muted-foreground" aria-hidden />
                            ) : (
                                <Truck className="h-4 w-4 text-muted-foreground" aria-hidden />
                            )}
                            <h2 className="text-sm font-semibold text-foreground">Et maintenant ?</h2>
                        </div>
                        {unwound ? (
                            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                                {group.status === 'REFUNDED'
                                    ? 'Le remboursement est parti vers ton moyen de paiement — compte 5 à 10 jours ouvrés selon ta banque. Ta facture reste consultable : elle porte le montant remboursé.'
                                    : 'Cette commande a été annulée : rien ne t’a été débité, et la pièce est retournée au catalogue de l’atelier.'}
                            </p>
                        ) : null}
                        <p className={cn('mt-1.5 text-xs leading-relaxed text-muted-foreground', unwound && 'hidden')}>
                            {sellerCount > 1
                                ? `${sellerCount} ateliers préparent ta commande : tu recevras ${sellerCount} colis, chacun avec son suivi. Tu es prévenu à chaque expédition.`
                                : 'L’atelier prépare ta pièce. Tu reçois une notification avec le numéro de suivi dès l’expédition.'}
                        </p>
                        <p className={cn('mt-1.5 text-xs leading-relaxed text-muted-foreground', unwound && 'hidden')}>
                            Lumiris retient le paiement jusqu’à la livraison — tu peux demander un retour pendant 14
                            jours après réception.
                        </p>
                    </section>

                    <section
                        className={cn(
                            'rounded-2xl border border-lumiris-emerald/30 bg-lumiris-emerald/5 p-4',
                            unwound && 'hidden',
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-lumiris-emerald" />
                            <h2 className="text-sm font-semibold text-foreground">Ajouté à ta Garde-Robe</h2>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                            {settling
                                ? 'Ta pièce rejoint ta Garde-Robe dès la validation du paiement, avec son passeport et ses justificatifs.'
                                : 'Ta pièce a rejoint ta Garde-Robe avec son passeport numérique. Tes justificatifs sont rattachés :'}
                        </p>
                        {!settling ? (
                            <ul className="mt-3 flex flex-col gap-2">
                                <li className="flex items-center gap-2 text-sm text-foreground">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    Facture {group.invoiceNumber}
                                </li>
                                <li className="flex items-center gap-2 text-sm text-foreground">
                                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                                    Certificat de garantie
                                </li>
                            </ul>
                        ) : null}
                    </section>

                    {!settling && !unwound && wardrobe.length > 0 ? (
                        <p className="text-center text-xs text-muted-foreground">
                            {wardrobe.length} pièce{wardrobe.length > 1 ? 's' : ''} dans ta Garde-Robe.
                        </p>
                    ) : null}
                </div>
            ) : timedOut ? (
                // (b) Borne atteinte sans commande visible : repli explicite avec CTA, pas de
                // spinner infini. Le paiement est passé ; la confirmation suit sous peu.
                <div className="mt-8 px-4">
                    <section className="rounded-2xl border border-lumiris-amber/30 bg-lumiris-amber/10 p-4">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-lumiris-amber" />
                            <h2 className="text-sm font-semibold text-foreground">Paiement en cours de confirmation</h2>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                            Ton paiement est bien reçu. La confirmation de ta commande peut prendre quelques instants —
                            tu la retrouveras dans « Mes commandes » dès qu&apos;elle est validée, avec son suivi.
                        </p>
                        {/* Sans porte de sortie, l'acheteur reste sur un écran qui n'évoluera plus
                            et croit son paiement perdu. */}
                        <Link
                            href="/me/orders"
                            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-lumiris-amber/40 px-3 py-1.5 text-xs font-semibold text-foreground"
                        >
                            Voir mes commandes
                        </Link>
                    </section>
                </div>
            ) : (
                <div className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Récupération de ta commande…
                </div>
            )}

            <div className="mt-8 flex flex-col gap-2 px-4">
                {group?.invoiceNumber && targetPi ? (
                    <Link
                        href={routes.orderInvoice(targetPi)}
                        className="flex w-full items-center justify-center gap-2 rounded-full border border-border py-3 text-sm font-semibold text-foreground"
                    >
                        <FileText className="h-4 w-4" />
                        Télécharger la facture
                    </Link>
                ) : null}
                <Link
                    href="/garde-robe"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm font-semibold text-primary-foreground"
                >
                    Voir ma Garde-Robe
                </Link>
                <Link
                    href="/boutique"
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-border py-3 text-sm font-semibold text-foreground"
                >
                    Continuer mes achats
                </Link>
            </div>
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
