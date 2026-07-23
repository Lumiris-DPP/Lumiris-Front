import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Loader2, Lock, LogIn, MapPin, ShieldCheck, Shirt, UserPlus } from 'lucide-react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useApiClient } from '@lumiris/api-client/react';
import type { PaymentIntentResponse } from '@lumiris/api-client';
import { useUser } from '@/lib/auth/use-user';
import { clearCart, formatCents, useCartDetails, type CartItemDetail } from '@/lib/marketplace';
import { getStripe } from '@/lib/stripe';

// Chemin de retour après connexion : ramène l'utilisateur directement au paiement.
const CHECKOUT_RETURN = encodeURIComponent('/checkout');

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
    const navigate = useNavigate();
    const { user, isAuthenticated } = useUser();
    const client = useApiClient();
    const { items, subtotalCents, sellerCount, isLoading } = useCartDetails();

    const [intent, setIntent] = useState<PaymentIntentResponse | null>(null);
    const [intentError, setIntentError] = useState<string | null>(null);

    // Prépare le PaymentIntent dès que le panier réel est connu (mono-vendeur), une seule
    // fois par signature de panier (promesse partagée entre montages). N'est JAMAIS créé pour
    // un invité : l'authentification est exigée avant tout appel (évite un 401 « Paiement
    // indisponible » et une commande PENDING orpheline).
    useEffect(() => {
        if (isLoading || items.length === 0 || !isAuthenticated) return;
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
    }, [isLoading, items, sellerCount, isAuthenticated]);

    if (!isLoading && items.length === 0 && !intent) {
        return (
            <div className="bg-background flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
                <p className="text-foreground text-base font-semibold">Aucun article à régler</p>
                <button
                    type="button"
                    onClick={() => navigate('/boutique', { replace: true })}
                    className="bg-foreground text-primary-foreground inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
                >
                    Retour à la Boutique
                </button>
            </div>
        );
    }

    // Porte d'authentification : un invité doit se connecter avant de payer. Le panier n'est
    // PAS vidé — il sera fusionné et restauré au retour (returnTo=/checkout).
    if (!isAuthenticated) {
        return (
            <div className="bg-background flex h-full flex-col items-center justify-center gap-5 px-8 text-center">
                <div className="border-border/60 bg-card flex h-16 w-16 items-center justify-center rounded-3xl border">
                    <Lock className="text-muted-foreground h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-foreground text-lg font-bold">Connecte-toi pour finaliser</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Crée un compte ou connecte-toi pour régler en toute sécurité. Ton panier est conservé.
                    </p>
                </div>
                <div className="flex w-full max-w-xs flex-col gap-2">
                    <Link
                        to={`/auth/sign-in?returnTo=${CHECKOUT_RETURN}`}
                        className="bg-foreground text-primary-foreground inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                    >
                        <LogIn className="h-4 w-4" />
                        Se connecter
                    </Link>
                    <Link
                        to={`/auth/sign-in?mode=signup&returnTo=${CHECKOUT_RETURN}`}
                        className="border-border text-foreground inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold"
                    >
                        <UserPlus className="h-4 w-4" />
                        Créer un compte
                    </Link>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/panier', { replace: true })}
                    className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
                >
                    Revenir au panier
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
                    onClick={() => navigate('/panier', { replace: true })}
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
                items={items}
                amountTotalCents={intent.amountTotalCents}
                subtotalCents={subtotalCents}
                defaultName={user?.displayName ?? ''}
                onBack={() => navigate(-1)}
                onPaid={(paymentIntentId) => {
                    intentCache.clear();
                    clearCart();
                    // Confirmation rattachée au PaymentIntent → total réel (articles + livraison)
                    // et toutes les lignes de la commande, via GET /api/orders/group/{pi}.
                    navigate(`/commande/${paymentIntentId}`, { replace: true });
                }}
            />
        </Elements>
    );
}

function CheckoutForm({
    items,
    amountTotalCents,
    subtotalCents,
    defaultName,
    onBack,
    onPaid,
}: {
    items: readonly CartItemDetail[];
    amountTotalCents: number;
    subtotalCents: number;
    defaultName: string;
    onBack: () => void;
    onPaid: (paymentIntentId: string) => void;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [address, setAddress] = useState<Address>({ fullName: defaultName, line1: '', postalCode: '', city: '' });
    const [submitting, setSubmitting] = useState(false);
    const [payError, setPayError] = useState<string | null>(null);

    // Frais de port = total facturé par le backend − sous-total des articles (jamais négatif).
    const shippingCents = Math.max(0, amountTotalCents - subtotalCents);

    const addressValid =
        address.fullName.trim().length > 1 &&
        address.line1.trim().length > 2 &&
        address.postalCode.trim().length >= 4 &&
        address.city.trim().length > 1;

    const payDisabled = !stripe || !addressValid || submitting;

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (!stripe || !elements || !addressValid || submitting) return;
        setSubmitting(true);
        setPayError(null);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Retour après redirection (3-D Secure) : Stripe ajoute ?payment_intent=…
                // que l'écran de confirmation lit pour charger le groupe de commande.
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
            onPaid(paymentIntent.id);
            return;
        }
        setSubmitting(false);
    }

    return (
        <form onSubmit={handleSubmit} className="bg-background flex h-full flex-col overflow-y-auto pb-44 md:pb-20">
            <motion.header
                className="mx-auto flex w-full max-w-md items-center gap-3 px-4 pb-3 pt-12 md:max-w-4xl md:px-6"
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

            {/* Sur md+ : deux colonnes (formulaire à gauche, récapitulatif collant à droite).
                Sur mobile : une seule colonne, le récapitulatif reste clairement visible sous le
                formulaire et au-dessus de la barre de paiement fixe. */}
            <div className="mx-auto w-full max-w-md px-4 md:max-w-4xl md:px-6">
                <div className="md:grid md:grid-cols-[minmax(0,1fr)_20rem] md:items-start md:gap-8">
                    {/* Colonne gauche : adresse + moyen de paiement */}
                    <div className="flex flex-col gap-6">
                        <section className="flex flex-col gap-3">
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
                                    onChange={(v) =>
                                        setAddress((a) => ({ ...a, postalCode: onlyDigits(v).slice(0, 5) }))
                                    }
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

                        <section className="flex flex-col gap-3">
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
                                Paiement sécurisé par Stripe. Le vendeur est réglé directement ; Lumiris ne stocke
                                aucune donnée de carte. Carte de test : 4242 4242 4242 4242.
                            </p>
                        </section>
                    </div>

                    {/* Colonne droite : récapitulatif (collant sur md+) + paiement sur desktop */}
                    <aside className="mt-6 md:mt-0 md:sticky md:top-6">
                        <RecapCard
                            items={items}
                            subtotalCents={subtotalCents}
                            shippingCents={shippingCents}
                            amountTotalCents={amountTotalCents}
                        />
                        <div className="mt-4 hidden md:block">
                            <PayAction
                                disabled={payDisabled}
                                submitting={submitting}
                                amountTotalCents={amountTotalCents}
                            />
                        </div>
                    </aside>
                </div>
            </div>

            {/* Barre de paiement fixe — mobile uniquement (sur md+ le bouton vit dans le récap). */}
            <div className="border-border/60 bg-background/90 fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t px-4 pb-6 pt-3 backdrop-blur md:hidden">
                <PayAction disabled={payDisabled} submitting={submitting} amountTotalCents={amountTotalCents} />
            </div>
        </form>
    );
}

function RecapCard({
    items,
    subtotalCents,
    shippingCents,
    amountTotalCents,
}: {
    items: readonly CartItemDetail[];
    subtotalCents: number;
    shippingCents: number;
    amountTotalCents: number;
}) {
    return (
        <div className="border-border/60 bg-card opal-shadow rounded-2xl border p-4">
            <h2 className="text-foreground text-sm font-semibold">Récapitulatif</h2>
            {items.length > 0 ? (
                <ul className="mt-3 flex flex-col gap-3">
                    {items.map((it) => (
                        <li key={it.product.id} className="flex items-center gap-3">
                            <div className="bg-muted relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                                {it.product.photoUrl ? (
                                    <img
                                        src={it.product.photoUrl}
                                        alt={it.product.name}
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />
                                ) : (
                                    <Shirt className="text-muted-foreground/30 h-5 w-5" strokeWidth={1.5} aria-hidden />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-foreground truncate text-xs font-medium">{it.product.name}</p>
                                <p className="text-muted-foreground truncate text-[11px]">
                                    {it.product.artisanName}
                                    {it.quantity > 1 ? ` · ×${it.quantity}` : ''}
                                </p>
                            </div>
                            <span className="text-foreground shrink-0 text-xs font-semibold tabular-nums">
                                {formatCents(it.lineTotalCents)}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : null}
            <dl className="border-border/60 mt-4 flex flex-col gap-2 border-t pt-3 text-sm">
                <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Sous-total</dt>
                    <dd className="text-foreground tabular-nums">{formatCents(subtotalCents)}</dd>
                </div>
                <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Livraison</dt>
                    <dd className="text-foreground tabular-nums">
                        {shippingCents === 0 ? 'Offerte' : formatCents(shippingCents)}
                    </dd>
                </div>
                <div className="border-border/60 mt-1 flex items-center justify-between border-t pt-2 font-semibold">
                    <dt className="text-foreground">Total</dt>
                    <dd className="text-foreground tabular-nums">{formatCents(amountTotalCents)}</dd>
                </div>
            </dl>
        </div>
    );
}

function PayAction({
    disabled,
    submitting,
    amountTotalCents,
}: {
    disabled: boolean;
    submitting: boolean;
    amountTotalCents: number;
}) {
    return (
        <>
            <button
                type="submit"
                disabled={disabled}
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
            <p className="text-muted-foreground mt-2 text-center text-[11px]">
                Payez en plusieurs fois avec Klarna.
            </p>
        </>
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
