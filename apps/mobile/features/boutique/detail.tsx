'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from '@/components/navigation-link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BadgeCheck, Clock, Info, MapPin, RotateCcw, ShieldCheck, Shirt, Truck } from 'lucide-react';
import { isApiError, useApiClient, useMarketplaceProduct } from '@lumiris/api-client/react';
import { IrisGrade } from '@lumiris/scoring-ui';
import { Skeleton } from '@lumiris/ui/components/skeleton';
import { marketplaceCategoryLabel } from '@/lib/marketplace/labels';
import { preparationLabel, toMarketplaceItem, type MarketplaceItem } from '@/lib/marketplace/product';
import { FavoriteButton } from './components/favorite-button';
import { PurchaseBar } from './components/purchase-bar';
import { shippingTermsOf } from './models/purchase-state';
import { SizeGuideSheet } from './components/size-guide-sheet';
import { useProductPurchase } from './hooks/use-product-purchase';
import { VariantPicker } from './components/variant-picker';

const viewed = new Set<string>();

// Charge la pièce choisie et affiche son détail.
export function BoutiqueDetail({ productId }: { productId: string }) {
    const router = useRouter();
    const client = useApiClient();

    const { data: dto, isLoading, error, refetch } = useMarketplaceProduct(productId);

    const product = useMemo<MarketplaceItem | null>(() => (dto ? toMarketplaceItem(dto) : null), [dto]);

    useEffect(() => {
        if (!product || viewed.has(productId)) return;
        viewed.add(productId);
        void client.marketplace.trackView(productId).catch(() => {});
    }, [client, product, productId]);

    if (isLoading) {
        return (
            <div className="flex h-full flex-col gap-4 bg-background p-5 pt-14">
                <p role="status" className="sr-only">
                    Chargement de la pièce…
                </p>
                <Skeleton className="h-64 w-full rounded-3xl" />
                <Skeleton className="h-6 w-2/3 rounded-full" />
                <Skeleton className="h-4 w-1/3 rounded-full" />
            </div>
        );
    }

    if (!product) {
        const notFound = !error || (isApiError(error) && error.code === 'NOT_FOUND');
        return <ProductUnavailable notFound={notFound} onRetry={() => void refetch()} />;
    }

    return <DetailBody key={product.id} product={product} onBack={() => router.back()} />;
}

// Affiche une pièce introuvable ou une erreur avec relance.
function ProductUnavailable({ notFound, onRetry }: { notFound: boolean; onRetry: () => void }) {
    return (
        <div
            role={notFound ? undefined : 'alert'}
            className="flex h-full flex-col items-center justify-center gap-4 bg-background px-8 text-center"
        >
            <h1 className="text-base font-semibold text-foreground">
                {notFound ? 'Pièce introuvable' : 'Chargement impossible'}
            </h1>
            <p className="text-sm text-muted-foreground">
                {notFound
                    ? 'Cette pièce n’est plus disponible à l’achat.'
                    : 'Impossible d’afficher cette pièce pour le moment. Réessaie.'}
            </p>
            {notFound ? null : (
                <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground"
                >
                    Réessayer
                </button>
            )}
            <Link
                href="/boutique"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
                Retour à la Boutique
            </Link>
        </div>
    );
}

// Affiche la pièce et gère sa sélection pour l’achat.
function DetailBody({ product, onBack }: { product: MarketplaceItem; onBack: () => void }) {
    const purchase = useProductPurchase(product);
    const [guideOpen, setGuideOpen] = useState(false);

    return (
        <div className="relative flex h-full flex-col overflow-y-auto bg-background pb-44">
            <button
                type="button"
                onClick={onBack}
                aria-label="Retour"
                className="absolute top-12 left-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/90 text-foreground backdrop-blur"
            >
                <ArrowLeft className="h-4 w-4" />
            </button>

            <FavoriteButton item={product} className="absolute top-12 right-4 z-20 h-9 w-9" />

            <div className="relative flex h-72 w-full items-center justify-center bg-muted">
                {product.photoUrl ? (
                    <Image src={product.photoUrl} alt={product.name} fill className="object-cover" unoptimized />
                ) : (
                    <Shirt className="h-16 w-16 text-muted-foreground/25" strokeWidth={1.25} aria-hidden />
                )}
                {product.irisGrade ? (
                    <span className="absolute right-4 bottom-4">
                        <IrisGrade grade={product.irisGrade} size="md" tone="solid" />
                    </span>
                ) : null}
            </div>

            <div className="flex flex-col gap-4 px-5 pt-5">
                <div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        <BadgeCheck className="h-3 w-3" strokeWidth={1.5} aria-hidden />
                        Passeport Lumiris vérifié
                    </span>
                    <h1 className="mt-2 text-xl leading-tight font-bold text-balance text-foreground">
                        {product.name}
                    </h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">Vendu par {product.artisanName}</p>
                </div>

                {product.description ? (
                    <p className="text-sm leading-relaxed text-foreground/90">{product.description}</p>
                ) : null}

                <VariantPicker
                    item={product}
                    selection={purchase.selection}
                    onChange={purchase.setSelection}
                    onOpenSizeGuide={product.sizeGuide.length > 0 ? () => setGuideOpen(true) : undefined}
                />

                <ProductFacts product={product} />
                <DeliveryTerms product={product} />
                {product.irisGrade ? <IrisGradeExplainer grade={product.irisGrade} /> : null}
            </div>

            <PurchaseBar
                product={product}
                state={purchase.state}
                added={purchase.added}
                inCart={purchase.inCart}
                onAdd={purchase.add}
                onBuyNow={purchase.buyNow}
            />

            <SizeGuideSheet open={guideOpen} onOpenChange={setGuideOpen} measurements={product.sizeGuide} />
        </div>
    );
}

// Affiche les caractéristiques connues de la pièce.
function ProductFacts({ product }: { product: MarketplaceItem }) {
    return (
        <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-border/60 bg-card p-4 text-sm">
            {product.material ? (
                <div>
                    <dt className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Matière
                    </dt>
                    <dd className="mt-0.5 text-foreground">{product.material}</dd>
                </div>
            ) : null}
            {product.category ? (
                <div>
                    <dt className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Catégorie
                    </dt>
                    <dd className="mt-0.5 text-foreground">{marketplaceCategoryLabel(product.category)}</dd>
                </div>
            ) : null}
            {product.originCountry ? (
                <div>
                    <dt className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        <MapPin className="h-3 w-3" aria-hidden />
                        Origine
                    </dt>
                    <dd className="mt-0.5 text-foreground">{product.originCountry}</dd>
                </div>
            ) : null}
            {product.dppFormId ? (
                <div>
                    <dt className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Traçabilité
                    </dt>
                    <dd className="mt-0.5 text-foreground">Passeport numérique complet</dd>
                </div>
            ) : null}
        </dl>
    );
}

// Affiche les conditions de livraison, de retour et de garantie.
function DeliveryTerms({ product }: { product: MarketplaceItem }) {
    return (
        <section
            aria-label="Livraison, retours et garantie"
            className="flex flex-col divide-y divide-border/50 rounded-2xl border border-border/60 bg-card text-sm"
        >
            {preparationLabel(product.preparationDays) ? (
                <InfoRow Icon={Clock} label="Préparation">
                    Cette pièce est préparée par l&apos;atelier — expédiée sous {product.preparationDays} jour
                    {product.preparationDays > 1 ? 's' : ''} après ta commande.
                    {product.atelierPausedUntil
                        ? ` L'atelier est en pause, de retour le ${formatShortDate(product.atelierPausedUntil)}.`
                        : ''}
                </InfoRow>
            ) : null}
            <InfoRow Icon={Truck} label="Livraison">
                {shippingTermsOf(product.shippingCents)}
            </InfoRow>
            {product.returnPolicy ? (
                <InfoRow Icon={RotateCcw} label="Retours">
                    {product.returnPolicy}
                </InfoRow>
            ) : null}
            {product.warrantyDescription ? (
                <InfoRow Icon={ShieldCheck} label="Garantie">
                    {product.warrantyDescription}
                </InfoRow>
            ) : null}
        </section>
    );
}

// Formate la date en jour et mois français.
function formatShortDate(value: string): string {
    return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

// Affiche une information du produit avec son icône.
function InfoRow({ Icon, label, children }: { Icon: typeof Truck; label: string; children: ReactNode }) {
    return (
        <div className="flex items-start gap-3 p-4">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden />
            <div className="min-w-0">
                <p className="font-medium text-foreground">{label}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{children}</p>
            </div>
        </div>
    );
}

const IRIS_GRADE_LABEL_FR: Record<NonNullable<MarketplaceItem['irisGrade']>, string> = {
    A: 'exceptionnel',
    B: 'bon',
    C: 'moyen',
    D: 'faible',
    E: 'opaque',
};

// Explique la note Iris de la pièce.
function IrisGradeExplainer({ grade }: { grade: NonNullable<MarketplaceItem['irisGrade']> }) {
    return (
        <section aria-label="Comprendre le score Iris" className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                <h2 className="text-sm font-semibold text-foreground">Le score Iris</h2>
            </div>
            <div className="mt-2 flex items-start gap-3">
                <IrisGrade grade={grade} size="sm" tone="solid" />
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                    Le score Iris note la transparence et la durabilité de la pièce, de{' '}
                    <strong className="text-foreground">A</strong> (exceptionnel) à{' '}
                    <strong className="text-foreground">E</strong> (opaque), à partir des données vérifiées de son
                    passeport numérique. Cette pièce est notée <strong className="text-foreground">{grade}</strong> —{' '}
                    {IRIS_GRADE_LABEL_FR[grade]}.
                </p>
            </div>
        </section>
    );
}
