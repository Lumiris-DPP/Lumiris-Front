'use client';

import { useEffect, useState, type SyntheticEvent } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Loader2, Lock, ShieldCheck } from 'lucide-react';
import { isApiError, usePayQuote } from '@lumiris/api-client/react';
import { getStripe } from '@/lib/stripe';

const PAYMENT_REFUSED =
    'Ta carte a été refusée. Aucun montant n’a été prélevé — saisis une autre carte pour réessayer.';

function formatCents(cents: number): string {
    return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

function stripeAppearance() {
    return {
        theme: 'stripe' as const,
        variables: {
            colorPrimary: '#0e7490',
            colorText: '#1a1c20',
            colorTextSecondary: '#6b7280',
            colorBackground: '#ffffff',
            colorDanger: '#c0344d',
            borderRadius: '10px',
            spacingUnit: '4px',
            fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
        },
        rules: {
            '.Input': { border: '1px solid #e3e4e6', boxShadow: 'none' },
            '.Input:focus': { border: '1px solid #1a1c20', boxShadow: 'none' },
            '.Tab': { border: '1px solid #e3e4e6', boxShadow: 'none' },
            '.Tab--selected': { borderColor: '#0e7490', color: '#0e7490' },
        },
    };
}

/**
 * Prépare le PaymentIntent du devis (le paiement vaut acceptation, cf. backend) puis affiche le
 * Payment Element une fois le client secret disponible. La demande passera en ACCEPTED via le
 * webhook Stripe, pas immédiatement au clic — `onPaid` ferme l'écran de façon optimiste.
 */
export function RepairPaymentPanel({
    requestId,
    appointmentAt,
    onPaid,
    onCancel,
}: {
    requestId: string;
    appointmentAt: string;
    onPaid: () => void;
    onCancel: () => void;
}) {
    const payQuote = usePayQuote();
    const [prepareError, setPrepareError] = useState<string | null>(null);

    useEffect(() => {
        payQuote.mutate(
            { requestId, req: { appointmentAt } },
            {
                onError: (err) =>
                    setPrepareError(isApiError(err) ? err.message : 'Impossible de préparer le paiement.'),
            },
        );
        // Un seul PaymentIntent par montage de ce panneau.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requestId]);

    if (prepareError) {
        return (
            <div className="mt-4 flex flex-col gap-2">
                <p className="text-xs text-destructive" role="alert">
                    {prepareError}
                </p>
                <button
                    type="button"
                    onClick={onCancel}
                    className="self-start rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground"
                >
                    Retour
                </button>
            </div>
        );
    }

    if (!payQuote.data) {
        return (
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Préparation du paiement sécurisé…
            </div>
        );
    }

    const intent = payQuote.data;

    return (
        <Elements
            stripe={getStripe(intent.publishableKey)}
            options={{ clientSecret: intent.clientSecret, appearance: stripeAppearance() }}
        >
            <RepairPaymentForm amountCents={intent.amountCents} onPaid={onPaid} onCancel={onCancel} />
        </Elements>
    );
}

function RepairPaymentForm({
    amountCents,
    onPaid,
    onCancel,
}: {
    amountCents: number;
    onPaid: () => void;
    onCancel: () => void;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [submitting, setSubmitting] = useState(false);
    const [payError, setPayError] = useState<string | null>(null);

    async function handleSubmit(event: SyntheticEvent) {
        event.preventDefault();
        if (!stripe || !elements || submitting) return;
        setSubmitting(true);
        setPayError(null);

        try {
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: { return_url: window.location.href },
                redirect: 'if_required',
            });

            if (error) {
                setPayError(error.message ?? PAYMENT_REFUSED);
                return;
            }
            if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
                onPaid();
                return;
            }
            setPayError(PAYMENT_REFUSED);
        } catch {
            setPayError('Le paiement n’a pas pu être confirmé. Vérifie ta connexion et réessaie.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
            <div className="rounded-2xl border border-border/60 bg-background p-3">
                <PaymentElement options={{ layout: 'tabs' }} />
            </div>

            {payError ? (
                <p
                    role="alert"
                    className="rounded-xl border border-lumiris-rose/40 bg-lumiris-rose/10 px-3 py-2 text-xs font-medium text-lumiris-rose"
                >
                    {payError}
                </p>
            ) : null}

            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3 w-3" />
                Paiement sécurisé par Stripe. Carte de test : 4242 4242 4242 4242.
            </p>

            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={!stripe || submitting}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                >
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                    {submitting ? 'Traitement…' : `Payer ${formatCents(amountCents)}`}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    className="rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground disabled:opacity-50"
                >
                    Retour
                </button>
            </div>
        </form>
    );
}
