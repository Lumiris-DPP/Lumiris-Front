'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Loader2, Lock, MapPin, ShieldCheck } from 'lucide-react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useApiClient } from '@lumiris/api-client/react';
import type { PaymentIntentResponse } from '@lumiris/api-client';
import { useUser } from '@/lib/auth/use-user';
import { clearCart, formatCents, useCartDetails } from '@/lib/marketplace';
import { getStripe } from '@/lib/stripe';

interface Address {
    fullName: string;
    line1: string;
    postalCode: string;
    city: string;
}

const onlyDigits = (value: string) => value.replace(/\D/g, '');

// Un panier = une signature stable → un seul PaymentIntent. Ce cache (au niveau module)
// dédoublonne la création à travers les remounts StrictMode et les retours arrière, ce qui
// évite de créer des PaymentIntents (et des commandes PENDING) orphelins à chaque montage.
const intentCache = new Map<string, Promise<PaymentIntentResponse>>();

function cartSignature(items: ReadonlyArray<{ product: { id: string }; quantity: number }>): string {
    return items
        .map((it) => `${it.product.id}:${it.quantity}`)
        .sort()
        .join('|');
}

export function Checkout() {
    const router = useRouter();
    const { user } = useUser();
    const client = useApiClient();
    const { items, sellerCount, isLoading } = useCartDetails();

    const [intent, setIntent] = useState<PaymentIntentResponse | null>(null);
    const [intentError, setIntentError] = useState<string | null>(null);

    // Prépare le PaymentIntent dès que le panier réel est connu (mono-vendeur), une seule
    // fois par signature de panier (promesse partagée entre montages).
    useEffect(() => {
        if (isLoading || items.length === 0) return;
        if (sellerCount > 1) {
            setIntentError('Un panier ne peut contenir que des pièces d’un même atelier.');
            return;
        }
        const sig = cartSignature(items);
        let promise = intentCache.get(sig);
        if (!promise) {
            promise = client.marketplace.checkoutIntent({
                items: items.map((it) => ({ productId: it.product.id, quantity: it.quantity })),
            });
            intentCache.set(sig, promise);
        }
        let cancelled = false;
        promise
            .then((res) => {
                if (!cancelled) setIntent(res);
            })
            .catch((err: Error) => {
                intentCache.delete(sig);
                if (!cancelled) setIntentError(err.message || 'Impossible de préparer le paiement. Réessaie.');
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, items, sellerCount]);

    if (!isLoading && items.length === 0 && !intent) {
        return (
            <div className="bg-background flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
                <p className="text-foreground text-base font-semibold">Aucun article à régler</p>
                <button
                    type="button"
                    onClick={() => router.replace('/boutique')}
                    className="bg-foreground text-primary-foreground inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
                >
                    Retour à la Boutique
                </button>
            </div>
        );
    }

    if (intentError) {
        return (
            <div className="bg-background flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
                <p className="text-foreground text-base font-semibold">Paiement indisponible</p>
                <p className="text-muted-foreground text-sm">{intentError}</p>
                <button
                    type="button"
                    onClick={() => router.replace('/panier')}
                    className="bg-foreground text-primary-foreground inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
                >
                    Retour au panier
                </button>
            </div>
        );
    }

    if (!intent) {
        return (
            <div className="bg-background text-muted-foreground flex h-full items-center justify-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Préparation du paiement sécurisé…
            </div>
        );
    }

    return (
        <Elements
            stripe={getStripe(intent.publishableKey)}
            options={{
                clientSecret: intent.clientSecret,
                appearance: {
                    theme: 'stripe',
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
                },
            }}
        >
            <CheckoutForm
                amountTotalCents={intent.amountTotalCents}
                defaultName={user?.displayName ?? ''}
                onBack={() => router.back()}
                onPaid={() => {
                    intentCache.clear();
                    clearCart();
                    router.replace('/commande/latest');
                }}
            />
        </Elements>
    );
}

function CheckoutForm({
    amountTotalCents,
    defaultName,
    onBack,
    onPaid,
}: {
    amountTotalCents: number;
    defaultName: string;
    onBack: () => void;
    onPaid: () => void;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [address, setAddress] = useState<Address>({ fullName: defaultName, line1: '', postalCode: '', city: '' });
    const [submitting, setSubmitting] = useState(false);
    const [payError, setPayError] = useState<string | null>(null);

    const addressValid =
        address.fullName.trim().length > 1 &&
        address.line1.trim().length > 2 &&
        address.postalCode.trim().length >= 4 &&
        address.city.trim().length > 1;

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (!stripe || !elements || !addressValid || submitting) return;
        setSubmitting(true);
        setPayError(null);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/commande/latest`,
                shipping: {
                    name: address.fullName,
                    address: {
                        line1: address.line1,
                        postal_code: address.postalCode,
                        city: address.city,
                        country: 'FR',
                    },
                },
            },
            redirect: 'if_required',
        });

        if (error) {
            setPayError(error.message ?? 'Le paiement a échoué. Vérifie ta carte et réessaie.');
            setSubmitting(false);
            return;
        }
        if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
            onPaid();
            return;
        }
        setSubmitting(false);
    }

    return (
        <form onSubmit={handleSubmit} className="bg-background flex h-full flex-col overflow-y-auto pb-40">
            <motion.header
                className="flex items-center gap-3 px-4 pb-3 pt-12"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <button
                    type="button"
                    onClick={onBack}
                    aria-label="Retour"
                    className="border-border bg-card text-foreground inline-flex h-9 w-9 items-center justify-center rounded-full border"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <h1 className="text-foreground text-base font-bold">Paiement</h1>
            </motion.header>

            <section className="flex flex-col gap-3 px-4">
                <div className="flex items-center gap-2">
                    <MapPin className="text-muted-foreground h-4 w-4" />
                    <h2 className="text-foreground text-sm font-semibold">Adresse de livraison</h2>
                </div>
                <Field
                    label="Nom complet"
                    value={address.fullName}
                    onChange={(v) => setAddress((a) => ({ ...a, fullName: v }))}
                    autoComplete="name"
                />
                <Field
                    label="Adresse"
                    value={address.line1}
                    onChange={(v) => setAddress((a) => ({ ...a, line1: v }))}
                    autoComplete="address-line1"
                />
                <div className="flex gap-3">
                    <Field
                        label="Code postal"
                        value={address.postalCode}
                        onChange={(v) => setAddress((a) => ({ ...a, postalCode: onlyDigits(v).slice(0, 5) }))}
                        autoComplete="postal-code"
                        inputMode="numeric"
                        className="w-2/5"
                    />
                    <Field
                        label="Ville"
                        value={address.city}
                        onChange={(v) => setAddress((a) => ({ ...a, city: v }))}
                        autoComplete="address-level2"
                        className="flex-1"
                    />
                </div>
            </section>

            <section className="mt-6 flex flex-col gap-3 px-4">
                <div className="flex items-center gap-2">
                    <CreditCard className="text-muted-foreground h-4 w-4" />
                    <h2 className="text-foreground text-sm font-semibold">Paiement</h2>
                </div>
                <div className="border-border/60 bg-card rounded-2xl border p-4">
                    <PaymentElement options={{ layout: 'tabs' }} />
                </div>
                {payError ? <p className="text-lumiris-rose text-xs">{payError}</p> : null}
                <p className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                    <ShieldCheck className="h-3 w-3" />
                    Paiement sécurisé par Stripe. Le vendeur est réglé directement ; Lumiris ne stocke aucune donnée de
                    carte. Carte de test : 4242 4242 4242 4242.
                </p>
            </section>

            <div className="border-border/60 bg-background/90 fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t px-4 pb-6 pt-3 backdrop-blur">
                <button
                    type="submit"
                    disabled={!stripe || !addressValid || submitting}
                    className="bg-foreground text-primary-foreground flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold disabled:opacity-40"
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
            </div>
        </form>
    );
}

function Field({
    label,
    value,
    onChange,
    className,
    ...rest
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'className'>) {
    return (
        <label className={`flex flex-col gap-1 ${className ?? ''}`}>
            <span className="text-muted-foreground text-[11px] font-medium">{label}</span>
            <input
                {...rest}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="border-border bg-card text-foreground focus:border-foreground rounded-xl border px-3 py-2.5 text-sm outline-none"
            />
        </label>
    );
}
