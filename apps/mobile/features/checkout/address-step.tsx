'use client';

import { useState } from 'react';
import { ArrowRight, MapPin, Truck } from 'lucide-react';
import {
    EMPTY_ADDRESS,
    isShippingAddressComplete,
    normalizeShippingAddress,
    writeShippingAddress,
    type ShippingAddress,
} from '@/lib/marketplace';

const onlyDigits = (value: string) => value.replace(/\D/g, '');

// Première étape du tunnel : on demande l'adresse AVANT de préparer le paiement. L'atelier ne
// peut pas expédier sans elle, et créer un PaymentIntent pour un panier qui n'ira nulle part
// laisserait des commandes en attente et du stock réservé pour rien.
export function AddressStep({
    initial,
    shipmentCount,
    defaultName,
    onSubmit,
}: {
    initial: ShippingAddress | null;
    shipmentCount: number;
    defaultName: string;
    onSubmit: (address: ShippingAddress) => void;
}) {
    const [address, setAddress] = useState<ShippingAddress>(
        () => initial ?? { ...EMPTY_ADDRESS, fullName: defaultName },
    );
    const complete = isShippingAddressComplete(address);

    const set = <K extends keyof ShippingAddress>(key: K, value: ShippingAddress[K]) =>
        setAddress((a) => ({ ...a, [key]: value }));

    const submit = (event: React.SyntheticEvent) => {
        event.preventDefault();
        if (!complete) return;
        const normalized = normalizeShippingAddress(address);
        writeShippingAddress(normalized);
        onSubmit(normalized);
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-5">
            <section className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold text-foreground">Où livrer ta commande ?</h2>
                </div>

                <Field
                    label="Nom complet"
                    value={address.fullName}
                    onChange={(v) => set('fullName', v)}
                    autoComplete="name"
                />
                <Field
                    label="Adresse"
                    value={address.line1}
                    onChange={(v) => set('line1', v)}
                    autoComplete="address-line1"
                />
                <Field
                    label="Complément (facultatif)"
                    value={address.line2 ?? ''}
                    onChange={(v) => set('line2', v)}
                    autoComplete="address-line2"
                    placeholder="Bâtiment, étage, digicode…"
                />
                <div className="flex gap-3">
                    <Field
                        label="Code postal"
                        value={address.postalCode}
                        onChange={(v) => set('postalCode', onlyDigits(v).slice(0, 5))}
                        autoComplete="postal-code"
                        inputMode="numeric"
                        className="w-2/5"
                    />
                    <Field
                        label="Ville"
                        value={address.city}
                        onChange={(v) => set('city', v)}
                        autoComplete="address-level2"
                        className="flex-1"
                    />
                </div>
                <Field
                    label="Téléphone (facultatif)"
                    value={address.phone ?? ''}
                    onChange={(v) => set('phone', v)}
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="Pour la livraison"
                />
            </section>

            <p className="flex items-start gap-2 rounded-2xl border border-border/60 bg-card p-3 text-xs text-muted-foreground">
                <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                {shipmentCount > 1
                    ? `Tes pièces viennent de ${shipmentCount} ateliers : tu recevras ${shipmentCount} colis, chacun avec son suivi.`
                    : 'Tu recevras un colis avec son numéro de suivi dès son expédition.'}
            </p>

            <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-border/60 bg-background/90 px-4 pt-3 pb-6 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
                <button
                    type="submit"
                    disabled={!complete}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
                >
                    Continuer vers le paiement
                    <ArrowRight className="h-4 w-4" />
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
            <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
            <input
                {...rest}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-foreground"
            />
        </label>
    );
}
