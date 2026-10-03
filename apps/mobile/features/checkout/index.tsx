'use client';

import { useMemo, useState } from 'react';
import Link from '@/components/navigation-link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Lock, LogIn, UserPlus } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { isApiError, useTrackEvent } from '@lumiris/api-client/react';
import { routes } from '@/lib/routes';
import { useUser } from '@/lib/auth/use-user';
import {
    readShippingAddress,
    takeConversionOrigins,
    useCartDetails,
    type CartShipment,
    type ShippingAddress,
} from '@/lib/marketplace';
import { getStripe } from '@/lib/stripe';
import { AddressStep } from './address-step';
import type { CheckoutContext } from './checkout-context';
import { CheckoutRecap } from './recap';
import { PaymentStep } from './payment-step';
import { resetCheckoutIntents, useCheckoutIntent } from './use-checkout-intent';

// Chemin de retour après connexion : ramène l'utilisateur directement au paiement.
const CHECKOUT_RETURN = encodeURIComponent('/checkout');

type Step = 'address' | 'payment';

// Tunnel de paiement en deux étapes, adresse puis Payment Element, sur un panier relu sans erreur.
export function Checkout() {
    const router = useRouter();
    const { user, isAuthenticated } = useUser();
    const { mutate: trackEvent } = useTrackEvent();
    const cart = useCartDetails();
    const { items, shipments, subtotalCents, shippingCents, totalCents, loadState, hasBlockingIssue } = cart;

    const [step, setStep] = useState<Step>('address');
    const [address, setAddress] = useState<ShippingAddress | null>(null);

    // L'adresse déjà utilisée est proposée d'office ; l'acheteur la confirme d'un geste au lieu
    // de la retaper. Lue au montage seulement — ensuite l'état de l'écran fait foi.
    const [savedAddress] = useState(() => readShippingAddress());

    // Le PaymentIntent n'est préparé qu'une fois l'adresse validée et le panier relu sans problème :
    // un panier en chargement, en panne ou avec une ligne invalide ne se paie pas, même en partie.
    // Le contexte porte l'acheteur, les lignes exactes et l'adresse : si l'un change, il change.
    const buyerId = user?.id ?? null;
    const context = useMemo<CheckoutContext | null>(() => {
        if (step !== 'payment' || !address || !buyerId || hasBlockingIssue || items.length === 0) return null;
        return {
            buyerId,
            lines: items.map((it) => ({ productId: it.product.id, variantId: it.variant.id, quantity: it.quantity })),
            address,
        };
    }, [step, address, buyerId, hasBlockingIssue, items]);
    const { intent, error: intentError, retry: retryIntent } = useCheckoutIntent(context);

    if (loadState === 'ready' && cart.lines.length === 0) {
        return (
            <CheckoutMessage
                title="Aucun article à régler"
                action={{ label: 'Retour à la Boutique', onClick: () => router.replace('/boutique') }}
            />
        );
    }

    // Porte d'authentification : un invité doit se connecter avant de payer. Le panier n'est PAS
    // vidé — il sera fusionné et restauré au retour (returnTo=/checkout).
    if (!isAuthenticated) {
        return <SignInGate onBack={() => router.replace('/panier')} />;
    }

    if (loadState === 'loading') {
        return <CheckoutLoader label="Chargement du panier…" />;
    }

    if (loadState === 'error') {
        return (
            <CheckoutMessage
                title="Panier indisponible"
                description="Impossible de vérifier ton panier pour le moment. Réessaie dans quelques instants."
                action={{ label: 'Réessayer', onClick: cart.retry }}
            />
        );
    }

    if (hasBlockingIssue) {
        return (
            <CheckoutMessage
                title="Ton panier a changé"
                description="Une pièce n’est plus disponible telle que tu l’as choisie. Ajuste ton panier avant de payer."
                action={{ label: 'Revenir au panier', onClick: () => router.replace('/panier') }}
            />
        );
    }

    if (intentError) {
        // Refus métier (stock, atelier, taille) : le message du serveur dit quoi corriger. Incident
        // (réseau, service indisponible) : on propose de réessayer, sans message technique.
        const refused = isApiError(intentError) && ['VALIDATION_ERROR', 'NOT_FOUND'].includes(intentError.code);
        return refused ? (
            <CheckoutMessage
                title="Paiement indisponible"
                description={intentError.message}
                action={{ label: 'Modifier ma commande', onClick: () => setStep('address') }}
            />
        ) : (
            <CheckoutMessage
                title="Paiement indisponible"
                description="Le paiement ne répond pas pour le moment. Réessaie dans quelques instants."
                action={{ label: 'Réessayer', onClick: retryIntent }}
            />
        );
    }

    return (
        <div className="flex h-full flex-col overflow-y-auto bg-background pb-44 md:pb-20">
            <CheckoutHeader step={step} onBack={() => (step === 'payment' ? setStep('address') : router.back())} />

            <div className="mx-auto w-full max-w-md px-4 md:max-w-4xl md:px-6">
                {step === 'address' ? (
                    <AddressForm
                        savedAddress={address ?? savedAddress}
                        shipments={shipments}
                        subtotalCents={subtotalCents}
                        shippingCents={shippingCents}
                        totalCents={totalCents}
                        defaultName={user?.displayName ?? ''}
                        onSubmit={(next) => {
                            setAddress(next);
                            setStep('payment');
                        }}
                    />
                ) : !intent || !address ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Préparation du paiement sécurisé…
                    </div>
                ) : (
                    // Le client secret ne peut pas changer sous un Payment Element monté : un nouveau
                    // contexte remonte le formulaire sur le nouveau PaymentIntent.
                    <Elements
                        key={intent.clientSecret}
                        stripe={getStripe(intent.publishableKey)}
                        options={stripeOptions(intent.clientSecret)}
                    >
                        <PaymentStep
                            address={address}
                            shipments={shipments}
                            subtotalCents={intent.itemsTotalCents}
                            shippingCents={intent.shippingTotalCents}
                            amountTotalCents={intent.amountTotalCents}
                            onEditAddress={() => setStep('address')}
                            onPaid={(paymentIntentId) => {
                                // Rattache la conversion au passeport d'origine (clic suggestion). Le
                                // panier n'est pas vidé ici : l'écran de confirmation retire les lignes
                                // payées une fois le paiement confirmé par le serveur.
                                for (const publicCode of takeConversionOrigins(items.map((it) => it.product.id))) {
                                    trackEvent({ publicCode, type: 'CONVERSION' });
                                }
                                resetCheckoutIntents();
                                router.replace(routes.order(paymentIntentId));
                            }}
                        />
                    </Elements>
                )}
            </div>
        </div>
    );
}

// Attente plein écran, le temps que le panier soit relu.
function CheckoutLoader({ label }: { label: string }) {
    return (
        <div className="flex h-full items-center justify-center gap-2 bg-background text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {label}
        </div>
    );
}

function AddressForm({
    savedAddress,
    shipments,
    subtotalCents,
    shippingCents,
    totalCents,
    defaultName,
    onSubmit,
}: {
    savedAddress: ShippingAddress | null;
    shipments: readonly CartShipment[];
    subtotalCents: number;
    shippingCents: number;
    totalCents: number;
    defaultName: string;
    onSubmit: (address: ShippingAddress) => void;
}) {
    return (
        <div className="md:grid md:grid-cols-[minmax(0,1fr)_20rem] md:items-start md:gap-8">
            <AddressStep
                initial={savedAddress}
                shipmentCount={shipments.length}
                defaultName={defaultName}
                onSubmit={onSubmit}
            />
            <aside className="mt-6 md:sticky md:top-6 md:mt-0">
                <CheckoutRecap
                    shipments={shipments}
                    subtotalCents={subtotalCents}
                    shippingCents={shippingCents}
                    totalCents={totalCents}
                />
            </aside>
        </div>
    );
}

function CheckoutHeader({ step, onBack }: { step: Step; onBack: () => void }) {
    return (
        <motion.header
            className="mx-auto flex w-full max-w-md items-center gap-3 px-4 pt-12 pb-3 md:max-w-4xl md:px-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <button
                type="button"
                onClick={onBack}
                aria-label="Retour"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold text-foreground">{step === 'address' ? 'Livraison' : 'Paiement'}</h1>
                <p className="text-xs text-muted-foreground">Étape {step === 'address' ? 1 : 2} sur 2</p>
            </div>
            <StepDots active={step === 'address' ? 0 : 1} />
        </motion.header>
    );
}

function StepDots({ active }: { active: number }) {
    return (
        <span className="flex items-center gap-1.5" aria-hidden>
            {[0, 1].map((index) => (
                <span
                    key={index}
                    className={`h-1.5 rounded-full transition-all ${
                        index === active ? 'w-5 bg-foreground' : 'w-1.5 bg-border'
                    }`}
                />
            ))}
        </span>
    );
}

function SignInGate({ onBack }: { onBack: () => void }) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-5 bg-background px-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-border/60 bg-card">
                <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
                <h1 className="text-lg font-bold text-foreground">Connecte-toi pour finaliser</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Crée un compte ou connecte-toi pour régler en toute sécurité. Ton panier est conservé.
                </p>
            </div>
            <div className="flex w-full max-w-xs flex-col gap-2">
                <Link
                    href={`/auth/sign-in?returnTo=${CHECKOUT_RETURN}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-primary-foreground"
                >
                    <LogIn className="h-4 w-4" />
                    Se connecter
                </Link>
                <Link
                    href={`/auth/sign-in?mode=signup&returnTo=${CHECKOUT_RETURN}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground"
                >
                    <UserPlus className="h-4 w-4" />
                    Créer un compte
                </Link>
            </div>
            <button
                type="button"
                onClick={onBack}
                className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
                Revenir au panier
            </button>
        </div>
    );
}

function CheckoutMessage({
    title,
    description,
    action,
}: {
    title: string;
    description?: string;
    action: { label: string; onClick: () => void };
}) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-background px-8 text-center">
            <p className="text-base font-semibold text-foreground">{title}</p>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
            <button
                type="button"
                onClick={action.onClick}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
                {action.label}
            </button>
        </div>
    );
}

// Apparence du Payment Element alignée sur le design system (extraite pour garder le JSX lisible).
function stripeOptions(clientSecret: string) {
    return {
        clientSecret,
        appearance: {
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
        },
    };
}
