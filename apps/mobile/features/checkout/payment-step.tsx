'use client';

import { useEffect, useRef, useState } from 'react';
import { CreditCard, Loader2, Lock, Pencil, ShieldCheck } from 'lucide-react';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { routes } from '@/lib/routes';
import { formatCents, type CartShipment, type ShippingAddress } from '@/lib/marketplace';
import { CheckoutRecap } from './recap';

const PAYMENT_REFUSED =
    'Ta carte a été refusée. Aucun montant n’a été prélevé — saisis une autre carte pour réessayer.';

export function PaymentStep({
    address,
    shipments,
    subtotalCents,
    shippingCents,
    amountTotalCents,
    onEditAddress,
    onPaid,
}: {
    address: ShippingAddress;
    shipments: readonly CartShipment[];
    subtotalCents: number;
    shippingCents: number;
    amountTotalCents: number;
    onEditAddress: () => void;
    onPaid: (paymentIntentId: string) => void;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [submitting, setSubmitting] = useState(false);
    const [payError, setPayError] = useState<string | null>(null);
    const errorRef = useRef<HTMLParagraphElement | null>(null);

    // Le bouton de paiement vit dans une barre fixe : sans ce recentrage, le refus s'affiche
    // au-dessus de la zone visible et l'écran paraît n'avoir rien fait.
    useEffect(() => {
        if (payError) errorRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, [payError]);

    async function handleSubmit(event: React.SyntheticEvent) {
        event.preventDefault();
        if (!stripe || !elements || submitting) return;
        setSubmitting(true);
        setPayError(null);

        try {
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    // Retour après redirection (3-D Secure) : Stripe ajoute ?payment_intent=…
                    // que l'écran de confirmation lit pour charger le groupe de commande.
                    return_url: `${window.location.origin}${routes.order('latest')}`,
                    shipping: {
                        name: address.fullName,
                        phone: address.phone,
                        address: {
                            line1: address.line1,
                            line2: address.line2,
                            postal_code: address.postalCode,
                            city: address.city,
                            country: address.country ?? 'FR',
                        },
                    },
                },
                redirect: 'if_required',
            });

            if (error) {
                setPayError(error.message ?? PAYMENT_REFUSED);
                return;
            }
            if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
                onPaid(paymentIntent.id);
                return;
            }
            // Tout autre état (`requires_payment_method` sur une carte refusée, `canceled`) laisse
            // l'acheteur sur l'écran de paiement : sans message, l'écran semblait simplement ne
            // rien faire et il ne savait pas qu'il pouvait ressaisir sa carte.
            setPayError(PAYMENT_REFUSED);
        } catch {
            setPayError('Le paiement n’a pas pu être confirmé. Vérifie ta connexion et réessaie.');
        } finally {
            setSubmitting(false);
        }
    }

    const payAction = (
        <>
            <button
                type="submit"
                disabled={!stripe || submitting}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
            >
                {submitting ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Traitement…
                    </>
                ) : (
                    <>
                        <Lock className="h-4 w-4" />
                        Payer {formatCents(amountTotalCents)}
                    </>
                )}
            </button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">Payez en plusieurs fois avec Klarna.</p>
        </>
    );

    return (
        <form onSubmit={handleSubmit}>
            <div className="md:grid md:grid-cols-[minmax(0,1fr)_20rem] md:items-start md:gap-8">
                <div className="flex flex-col gap-6">
                    <DeliverySummary address={address} onEdit={onEditAddress} />

                    <section className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <h2 className="text-sm font-semibold text-foreground">Paiement</h2>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-card p-4">
                            <PaymentElement options={{ layout: 'tabs' }} />
                        </div>
                        {payError ? (
                            <p
                                ref={errorRef}
                                role="alert"
                                className="rounded-xl border border-lumiris-rose/40 bg-lumiris-rose/10 px-3 py-2 text-xs font-medium text-lumiris-rose"
                            >
                                {payError}
                            </p>
                        ) : null}
                        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <ShieldCheck className="h-3 w-3" />
                            Paiement sécurisé par Stripe. Lumiris retient les fonds jusqu&apos;à la livraison et ne
                            stocke aucune donnée de carte. Carte de test : 4242 4242 4242 4242.
                        </p>
                    </section>
                </div>

                <aside className="mt-6 md:sticky md:top-6 md:mt-0">
                    <CheckoutRecap
                        shipments={shipments}
                        subtotalCents={subtotalCents}
                        shippingCents={shippingCents}
                        totalCents={amountTotalCents}
                    />
                    <div className="mt-4 hidden md:block">{payAction}</div>
                </aside>
            </div>

            {/* Barre de paiement fixe — mobile uniquement (sur md+ le bouton vit dans le récap). */}
            <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-border/60 bg-background/90 px-4 pt-3 pb-6 backdrop-blur md:hidden">
                {payAction}
            </div>
        </form>
    );
}

function DeliverySummary({ address, onEdit }: { address: ShippingAddress; onEdit: () => void }) {
    return (
        <section className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-3">
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-muted-foreground">Livraison</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">{address.fullName}</p>
                <p className="text-xs text-muted-foreground">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ''} · {address.postalCode} {address.city}
                </p>
            </div>
            <button
                type="button"
                onClick={onEdit}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-foreground"
            >
                <Pencil className="h-3 w-3" />
                Modifier
            </button>
        </section>
    );
}
