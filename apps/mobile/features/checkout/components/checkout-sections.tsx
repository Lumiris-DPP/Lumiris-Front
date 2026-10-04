'use client';

import Link from '@/components/navigation-link';

import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Lock, LogIn, UserPlus } from 'lucide-react';

import { type CartShipment } from '@/lib/marketplace/cart-model';
import { type ShippingAddress } from '@/lib/marketplace/shipping-address';

import { AddressStep } from './address-step';

import { CheckoutRecap } from './recap';

const CHECKOUT_RETURN = encodeURIComponent('/checkout');
type Step = 'address' | 'payment';

export function CheckoutLoader({ label }: { label: string }) {
    return (
        <div className="flex h-full items-center justify-center gap-2 bg-background text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {label}
        </div>
    );
}

export function AddressForm({
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

export function CheckoutHeader({ step, onBack }: { step: Step; onBack: () => void }) {
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

export function SignInGate({ onBack }: { onBack: () => void }) {
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

export function CheckoutMessage({
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
