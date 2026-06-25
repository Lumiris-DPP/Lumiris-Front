'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Loader2, Lock, MapPin } from 'lucide-react';
import { useUser } from '@/lib/auth/use-user';
import { computeCartTotals, formatEur, placeOrder, useCart, type ShippingAddress } from '@/lib/marketplace';

const onlyDigits = (value: string) => value.replace(/\D/g, '');

export function Checkout() {
    const router = useRouter();
    const { user } = useUser();
    const lines = useCart();
    const totals = useMemo(() => computeCartTotals(lines), [lines]);

    const [address, setAddress] = useState<ShippingAddress>({
        fullName: user?.displayName ?? '',
        line1: '',
        postalCode: '',
        city: '',
    });
    const [card, setCard] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const cardDigits = onlyDigits(card);
    const formValid =
        address.fullName.trim().length > 1 &&
        address.line1.trim().length > 2 &&
        address.postalCode.trim().length >= 4 &&
        address.city.trim().length > 1 &&
        cardDigits.length >= 12 &&
        totals.items.length > 0;

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (!formValid || submitting) return;
        setSubmitting(true);
        try {
            const order = await placeOrder(lines, {
                address,
                cardLast4: cardDigits.slice(-4),
                userId: user?.id ?? null,
            });
            router.replace(`/commande/${order.id}`);
        } catch {
            setSubmitting(false);
        }
    }

    if (totals.items.length === 0 && !submitting) {
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

    return (
        <form onSubmit={handleSubmit} className="bg-background flex h-full flex-col overflow-y-auto pb-40">
            <motion.header
                className="flex items-center gap-3 px-4 pb-3 pt-12"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <button
                    type="button"
                    onClick={() => router.back()}
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
                    <h2 className="text-foreground text-sm font-semibold">Carte bancaire</h2>
                </div>
                <Field
                    label="Numéro de carte"
                    value={card}
                    onChange={(v) => setCard(onlyDigits(v).slice(0, 16))}
                    inputMode="numeric"
                    placeholder="4242 4242 4242 4242"
                />
                <p className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                    <Lock className="h-3 w-3" />
                    Paiement sécurisé simulé — aucune transaction réelle n&apos;est effectuée.
                </p>
            </section>

            <section className="mt-6 px-4">
                <div className="border-border/60 bg-card opal-shadow rounded-2xl border p-4">
                    <h2 className="text-foreground mb-3 text-sm font-semibold">Récapitulatif</h2>
                    <dl className="flex flex-col gap-1.5">
                        {totals.items.map((item) => (
                            <div key={item.passportId} className="flex items-center justify-between text-xs">
                                <dt className="text-muted-foreground truncate pr-2">
                                    {item.quantity} × {item.reference}
                                </dt>
                                <dd className="text-foreground shrink-0 tabular-nums">{formatEur(item.lineTotal)}</dd>
                            </div>
                        ))}
                        <div className="border-border/60 mt-1 flex items-center justify-between border-t pt-2 text-xs">
                            <dt className="text-muted-foreground">Frais de port</dt>
                            <dd className="text-foreground tabular-nums">{formatEur(totals.shipping)}</dd>
                        </div>
                        <div className="flex items-center justify-between pt-1 text-sm font-semibold">
                            <dt className="text-foreground">Total</dt>
                            <dd className="text-foreground tabular-nums">{formatEur(totals.total)}</dd>
                        </div>
                    </dl>
                </div>
            </section>

            <div className="border-border/60 bg-background/90 fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t px-4 pb-6 pt-3 backdrop-blur">
                <button
                    type="submit"
                    disabled={!formValid || submitting}
                    className="bg-foreground text-primary-foreground flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold disabled:opacity-40"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Traitement…
                        </>
                    ) : (
                        <>Payer {formatEur(totals.total)}</>
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
