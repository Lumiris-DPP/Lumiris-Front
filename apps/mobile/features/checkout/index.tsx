'use client';

import { useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Loader2 } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { useTrackEvent } from '@lumiris/api-client/react';
import { routes } from '@/lib/routes';
import { useUser } from '@/lib/auth/use-user';
import { readShippingAddress, type ShippingAddress } from '@/lib/marketplace/shipping-address';
import { takeConversionOrigins } from '@/lib/marketplace/conversion-attribution';
import { useCartDetails } from '@/lib/marketplace/use-cart-details';
import { getStripe } from '@/lib/stripe';

import { checkoutContextOf } from './models/checkout-context';
import { checkoutScreenOf } from './models/checkout-screen';
import { stripeOptions } from './models/stripe-options';
import {
    CheckoutLoader,
    AddressForm,
    CheckoutHeader,
    SignInGate,
    CheckoutMessage,
} from './components/checkout-sections';

import { PaymentStep } from './components/payment-step';
import { resetCheckoutIntents, useCheckoutIntent } from './hooks/use-checkout-intent';

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
    const context = useMemo(
        () => checkoutContextOf({ onPaymentStep: step === 'payment', address, buyerId, hasBlockingIssue, items }),
        [step, address, buyerId, hasBlockingIssue, items],
    );
    const { intent, error: intentError, retry: retryIntent } = useCheckoutIntent(context);

    const screen = checkoutScreenOf({
        loadState,
        lineCount: cart.lines.length,
        isAuthenticated,
        hasBlockingIssue,
        intentError,
    });
    if (screen.kind === 'empty') {
        return (
            <CheckoutMessage
                title="Aucun article à régler"
                action={{ label: 'Retour à la Boutique', onClick: () => router.replace('/boutique') }}
            />
        );
    }

    // Porte d'authentification : un invité doit se connecter avant de payer. Le panier n'est PAS
    // vidé — il sera fusionné et restauré au retour (returnTo=/checkout).
    if (screen.kind === 'sign-in') {
        return <SignInGate onBack={() => router.replace('/panier')} />;
    }

    if (screen.kind === 'loading') {
        return <CheckoutLoader label="Chargement du panier…" />;
    }

    if (screen.kind === 'load-error') {
        return (
            <CheckoutMessage
                title="Panier indisponible"
                description="Impossible de vérifier ton panier pour le moment. Réessaie dans quelques instants."
                action={{ label: 'Réessayer', onClick: cart.retry }}
            />
        );
    }

    if (screen.kind === 'cart-changed') {
        return (
            <CheckoutMessage
                title="Ton panier a changé"
                description="Une pièce n’est plus disponible telle que tu l’as choisie. Ajuste ton panier avant de payer."
                action={{ label: 'Revenir au panier', onClick: () => router.replace('/panier') }}
            />
        );
    }

    if (screen.kind === 'refused' || screen.kind === 'payment-down') {
        // Refus métier (stock, atelier, taille) : le message du serveur dit quoi corriger. Incident
        // (réseau, service indisponible) : on propose de réessayer, sans message technique.
        const refused = screen.kind === 'refused';
        return refused ? (
            <CheckoutMessage
                title="Paiement indisponible"
                description={screen.kind === 'refused' ? screen.message : ''}
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
                    <div
                        role="status"
                        className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"
                    >
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
