'use client';

import Image from 'next/image';
import { Package, RotateCcw, ShieldCheck, Shirt } from 'lucide-react';
import { joinNonEmpty } from '@lumiris/utils';
import {
    formatCents,
    preparationLabel,
    shippingCostLabel,
    variantLabel,
    type CartItemDetail,
    type CartShipment,
} from '@/lib/marketplace';

// Récapitulatif du panier, identique aux deux étapes du tunnel : l'acheteur doit voir la même
// décomposition avant de saisir son adresse et avant de payer, sinon le total semble bouger.
export function CheckoutRecap({
    shipments,
    subtotalCents,
    shippingCents,
    totalCents,
}: {
    shipments: readonly CartShipment[];
    subtotalCents: number;
    shippingCents: number;
    totalCents: number;
}) {
    return (
        <div className="opal-shadow rounded-2xl border border-border/60 bg-card p-4">
            <h2 className="text-sm font-semibold text-foreground">Récapitulatif</h2>

            <div className="mt-3 flex flex-col gap-4">
                {shipments.map((shipment, index) => (
                    <ShipmentRecap
                        key={shipment.artisanProfileId}
                        shipment={shipment}
                        parcelNumber={index + 1}
                        parcelCount={shipments.length}
                    />
                ))}
            </div>

            <dl className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-3 text-sm">
                <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Sous-total</dt>
                    <dd className="text-foreground tabular-nums">{formatCents(subtotalCents)}</dd>
                </div>
                <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">
                        Livraison{shipments.length > 1 ? ` · ${shipments.length} colis` : ''}
                    </dt>
                    <dd className="text-foreground tabular-nums">{shippingCostLabel(shippingCents)}</dd>
                </div>
                <div className="mt-1 flex items-center justify-between border-t border-border/60 pt-2 font-semibold">
                    <dt className="text-foreground">Total</dt>
                    <dd className="text-foreground tabular-nums">{formatCents(totalCents)}</dd>
                </div>
            </dl>

            <Reassurance shipments={shipments} />
        </div>
    );
}

function ShipmentRecap({
    shipment,
    parcelNumber,
    parcelCount,
}: {
    shipment: CartShipment;
    parcelNumber: number;
    parcelCount: number;
}) {
    const preparation = shipmentPreparationLabel(shipment);

    return (
        <section>
            <header className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Package className="h-3 w-3" aria-hidden />
                <span className="min-w-0 truncate font-medium">{shipment.artisanName}</span>
                {parcelCount > 1 ? (
                    <span className="shrink-0">
                        · colis {parcelNumber}/{parcelCount}
                    </span>
                ) : null}
                {preparation ? <span className="shrink-0">· {preparation}</span> : null}
            </header>

            <ul className="mt-2 flex flex-col gap-2">
                {shipment.items.map((item) => (
                    <ShipmentRecapLine key={`${item.product.id}:${item.variant.id}`} item={item} />
                ))}
            </ul>

            <p className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Livraison</span>
                <span className="tabular-nums">{shippingCostLabel(shipment.shippingCents)}</span>
            </p>
        </section>
    );
}

function ShipmentRecapLine({ item }: { item: CartItemDetail }) {
    const { product, variant, quantity } = item;
    const details = joinNonEmpty([variantLabel(variant), quantity > 1 ? `×${quantity}` : null]);

    return (
        <li className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                {product.photoUrl ? (
                    <Image
                        src={product.photoUrl}
                        alt={product.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                        unoptimized
                    />
                ) : (
                    <Shirt className="h-5 w-5 text-muted-foreground/30" strokeWidth={1.5} aria-hidden />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{product.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{details}</p>
            </div>
            <span className="shrink-0 text-xs font-semibold text-foreground tabular-nums">
                {formatCents(item.lineTotalCents)}
            </span>
        </li>
    );
}

// Ce qui se passe après le paiement, rappelé au moment où l'acheteur hésite : c'est là que la
// question « et si ça ne va pas ? » se pose, pas sur la fiche produit consultée dix minutes plus tôt.
function Reassurance({ shipments }: { shipments: readonly CartShipment[] }) {
    const policies = distinctProductTexts(shipments, (product) => product.returnPolicy);
    const warranties = distinctProductTexts(shipments, (product) => product.warrantyDescription);

    return (
        <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-3">
            <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
                <RotateCcw className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                <span>
                    Retour possible <strong className="text-foreground">14 jours</strong> après réception.
                    {policies.length > 0 ? ` ${policies.join(' · ')}` : ''}
                </span>
            </p>
            {warranties.length > 0 ? (
                <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                    <span>{warranties.join(' · ')}</span>
                </p>
            ) : null}
        </div>
    );
}

function distinctProductTexts(
    shipments: readonly CartShipment[],
    pick: (product: CartItemDetail['product']) => string | null | undefined,
): string[] {
    const texts = shipments.flatMap((shipment) => shipment.items.map((item) => pick(item.product)));
    return [...new Set(texts.filter((text): text is string => Boolean(text)))];
}

// Le colis part quand sa pièce la plus longue à préparer est prête.
function shipmentPreparationLabel(shipment: CartShipment): string | null {
    return preparationLabel(Math.max(0, ...shipment.items.map((item) => item.product.preparationDays)));
}
