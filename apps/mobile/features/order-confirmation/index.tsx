import { Suspense, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, FileText, Loader2, LogIn, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useMyOrders, useOrderGroup, useWardrobe } from '@lumiris/api-client/react';
import { useUser } from '@/lib/auth/use-user';
import { clearCart, formatCents } from '@/lib/marketplace';

// Retour au récapitulatif après connexion (invité arrivé sur la confirmation sans session).
const CONFIRM_RETURN = encodeURIComponent('/commande/latest');
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
    const [searchParams] = useSearchParams();
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
    const timedOut = pollExpired && settling;

    // (a) Invité : la commande n'est pas récupérable (query désactivée) → prompt de connexion
    // au lieu d'un spinner infini. Le paiement, lui, a bien été confirmé côté Stripe.
    if (!isAuthenticated) {
        return (
            <div className="bg-background flex h-full flex-col items-center justify-center gap-5 px-8 text-center">
                <div className="bg-lumiris-emerald/10 text-lumiris-emerald flex h-16 w-16 items-center justify-center rounded-full">
                    <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-foreground text-lg font-bold">Paiement reçu</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Connecte-toi pour retrouver ta commande, ta facture et ta pièce dans ta Garde-Robe.
                    </p>
                </div>
                <Link
                    to={`/auth/sign-in?returnTo=${CONFIRM_RETURN}`}
                    className="bg-foreground text-primary-foreground inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                >
                    <LogIn className="h-4 w-4" />
                    Se connecter
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-background flex h-full flex-col overflow-y-auto pb-28">
            <div className="flex flex-col items-center px-6 pt-16 text-center">
                <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    className="bg-lumiris-emerald/10 text-lumiris-emerald flex h-20 w-20 items-center justify-center rounded-full"
                >
                    <CheckCircle2 className="h-10 w-10" />
                </motion.div>
                <motion.h1
                    className="text-foreground mt-5 text-balance text-xl font-bold"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    {settling ? (timedOut ? 'Paiement en cours de confirmation' : 'Paiement reçu') : 'Commande confirmée'}
                </motion.h1>
                {group?.invoiceNumber ? (
                    <p className="text-muted-foreground mt-1 text-sm">
                        Facture <span className="text-foreground font-mono">{group.invoiceNumber}</span>
                    </p>
                ) : settling && !timedOut ? (
                    <p className="text-muted-foreground mt-1 inline-flex items-center gap-1.5 text-sm">
                        {groupLoading || group ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        Validation de la commande en cours…
                    </p>
                ) : null}
                <p className="text-muted-foreground/90 mt-2 inline-flex items-center gap-1.5 text-xs">
                    <Mail className="h-3.5 w-3.5" aria-hidden />
                    Un reçu t&apos;a été envoyé par email.
                </p>
            </div>

            {group ? (
                <div className="mt-8 flex flex-col gap-4 px-4">
                    <section className="border-border/60 bg-card opal-shadow rounded-2xl border p-4">
                        <h2 className="text-muted-foreground mb-3 text-[11px] font-semibold uppercase tracking-wider">
                            {group.lines.length > 1 ? `Articles (${group.lines.length})` : 'Article'}
                        </h2>
                        <ul className="flex flex-col gap-2">
                            {group.lines.map((line) => (
                                <li key={line.id} className="flex items-center justify-between gap-2">
                                    <span className="text-foreground truncate text-sm font-medium">
                                        {line.productName ?? 'Pièce achetée'}
                                    </span>
                                    <span className="text-foreground shrink-0 text-sm tabular-nums">
                                        {formatCents(line.amountTotalCents)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <dl className="border-border/60 mt-3 flex flex-col gap-2 border-t pt-3 text-sm">
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
                            <div className="border-border/60 mt-1 flex items-center justify-between border-t pt-2 font-semibold">
                                <dt className="text-foreground">Total payé</dt>
                                <dd className="text-foreground tabular-nums">
                                    {formatCents(group.amountChargedCents)}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <section className="border-lumiris-emerald/30 bg-lumiris-emerald/5 rounded-2xl border p-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="text-lumiris-emerald h-4 w-4" />
                            <h2 className="text-foreground text-sm font-semibold">Ajouté à ta Garde-Robe</h2>
                        </div>
                        <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                            {settling
                                ? 'Ta pièce rejoint ta Garde-Robe dès la validation du paiement, avec son passeport et ses justificatifs.'
                                : 'Ta pièce a rejoint ta Garde-Robe avec son passeport numérique. Tes justificatifs sont rattachés :'}
                        </p>
                        {!settling ? (
                            <ul className="mt-3 flex flex-col gap-2">
                                <li className="text-foreground flex items-center gap-2 text-sm">
                                    <FileText className="text-muted-foreground h-4 w-4" />
                                    Facture {group.invoiceNumber}
                                </li>
                                <li className="text-foreground flex items-center gap-2 text-sm">
                                    <ShieldCheck className="text-muted-foreground h-4 w-4" />
                                    Certificat de garantie
                                </li>
                            </ul>
                        ) : null}
                    </section>

                    {!settling && wardrobe.length > 0 ? (
                        <p className="text-muted-foreground text-center text-xs">
                            {wardrobe.length} pièce{wardrobe.length > 1 ? 's' : ''} dans ta Garde-Robe.
                        </p>
                    ) : null}
                </div>
            ) : timedOut ? (
                // (b) Borne atteinte sans commande visible : repli explicite avec CTA, pas de
                // spinner infini. Le paiement est passé ; la confirmation suit sous peu.
                <div className="mt-8 px-4">
                    <section className="border-lumiris-amber/30 bg-lumiris-amber/10 rounded-2xl border p-4">
                        <div className="flex items-center gap-2">
                            <Clock className="text-lumiris-amber h-4 w-4" />
                            <h2 className="text-foreground text-sm font-semibold">
                                Paiement en cours de confirmation
                            </h2>
                        </div>
                        <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                            Ton paiement est bien reçu. La confirmation de ta commande peut prendre quelques instants —
                            tu la retrouveras dans ta Garde-Robe dès qu&apos;elle est validée.
                        </p>
                    </section>
                </div>
            ) : (
                <div className="text-muted-foreground mt-10 flex items-center justify-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" /> Récupération de ta commande…
                </div>
            )}

            <div className="mt-8 flex flex-col gap-2 px-4">
                {group?.invoiceNumber && targetPi ? (
                    <Link
                        to={`/commande/${targetPi}/facture`}
                        className="border-border text-foreground flex w-full items-center justify-center gap-2 rounded-full border py-3 text-sm font-semibold"
                    >
                        <FileText className="h-4 w-4" />
                        Télécharger la facture
                    </Link>
                ) : null}
                <Link
                    to="/garde-robe"
                    className="bg-foreground text-primary-foreground flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold"
                >
                    Voir ma Garde-Robe
                </Link>
                <Link
                    to="/boutique"
                    className="border-border text-foreground flex w-full items-center justify-center gap-2 rounded-full border py-3 text-sm font-semibold"
                >
                    Continuer mes achats
                </Link>
            </div>
        </div>
    );
}

function CenteredSpinner({ label }: { label: string }) {
    return (
        <div className="bg-background text-muted-foreground flex h-full items-center justify-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> {label}
        </div>
    );
}
