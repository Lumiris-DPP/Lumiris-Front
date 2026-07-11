'use client';

import { useEffect, useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { BillingCycle, SetupIntentDto } from '@lumiris/api-client';
import { useConfirmSubscription, useCreateSetupIntent } from '@lumiris/api-client/react';
import { Button } from '@lumiris/ui/components/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@lumiris/ui/components/dialog';
import { toast } from '@lumiris/ui/components/sonner';
import { getStripe } from '@/lib/stripe';

interface CheckoutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tier: string;
    cycle: BillingCycle;
    planLabel: string;
    amountLabel: string;
    onConfirmed?: () => void;
}

export function CheckoutDialog({
    open,
    onOpenChange,
    tier,
    cycle,
    planLabel,
    amountLabel,
    onConfirmed,
}: CheckoutDialogProps) {
    const createIntent = useCreateSetupIntent();
    const [intent, setIntent] = useState<SetupIntentDto | null>(null);

    useEffect(() => {
        if (!open) {
            setIntent(null);
            return;
        }
        if (createIntent.isPending) return;
        if (intent && intent.tier === tier && intent.cycle === cycle) return;
        createIntent.mutate(
            { tier, cycle },
            {
                onSuccess: setIntent,
                onError: () => toast.error('Impossible de préparer le paiement. Réessayez.'),
            },
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, tier, cycle, intent]);

    const stripePromise = intent?.publishableKey ? getStripe(intent.publishableKey) : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Souscrire — {planLabel}</DialogTitle>
                    <DialogDescription>
                        {amountLabel} · paiement sécurisé par Stripe. Carte de test : 4242 4242 4242 4242.
                    </DialogDescription>
                </DialogHeader>

                {!intent || !stripePromise ? (
                    <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" /> Préparation du paiement…
                    </div>
                ) : (
                    <Elements
                        stripe={stripePromise}
                        options={{
                            clientSecret: intent.clientSecret,
                            appearance: { theme: 'flat', variables: { colorPrimary: '#10b981' } },
                        }}
                    >
                        <CheckoutForm
                            amountLabel={amountLabel}
                            onConfirmed={() => {
                                onOpenChange(false);
                                onConfirmed?.();
                            }}
                        />
                    </Elements>
                )}
            </DialogContent>
        </Dialog>
    );
}

function CheckoutForm({ amountLabel, onConfirmed }: { amountLabel: string; onConfirmed: () => void }) {
    const stripe = useStripe();
    const elements = useElements();
    const confirmSubscription = useConfirmSubscription();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handlePay() {
        if (!stripe || !elements) return;
        setSubmitting(true);
        setError(null);

        const { error: stripeError, setupIntent } = await stripe.confirmSetup({
            elements,
            redirect: 'if_required',
        });

        if (stripeError) {
            setError(stripeError.message ?? 'Le paiement a échoué.');
            setSubmitting(false);
            return;
        }
        if (!setupIntent?.id) {
            setError('Confirmation incomplète. Réessayez.');
            setSubmitting(false);
            return;
        }

        confirmSubscription.mutate(setupIntent.id, {
            onSuccess: () => {
                toast.success('Abonnement activé', { description: 'Vous pouvez créer vos passeports.' });
                onConfirmed();
            },
            onError: () => {
                setError("L'abonnement n'a pas pu être finalisé. Votre carte n'a pas été débitée.");
                setSubmitting(false);
            },
        });
    }

    return (
        <div className="space-y-4">
            <PaymentElement options={{ layout: 'tabs', wallets: { applePay: 'never', googlePay: 'never' } }} />
            {error && (
                <p className="text-destructive text-xs" role="alert">
                    {error}
                </p>
            )}
            <Button
                type="button"
                onClick={handlePay}
                disabled={!stripe || submitting}
                className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 h-10 w-full text-white"
            >
                {submitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Traitement…
                    </>
                ) : (
                    <>
                        <Lock className="mr-2 h-3.5 w-3.5" /> Payer {amountLabel}
                    </>
                )}
            </Button>
        </div>
    );
}
