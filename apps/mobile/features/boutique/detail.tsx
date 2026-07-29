'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    BadgeCheck,
    Check,
    Info,
    MapPin,
    RotateCcw,
    ShieldCheck,
    Shirt,
    ShoppingCart,
    Truck,
} from 'lucide-react';
import { isApiError, useApiClient, useMarketplaceProduct } from '@lumiris/api-client/react';
import { IrisGrade } from '@lumiris/scoring-ui';
import { Button } from '@lumiris/ui/components/button';
import { Skeleton } from '@lumiris/ui/components/skeleton';
import { addToCart, formatCents, toMarketplaceItem, useCart, type MarketplaceItem } from '@/lib/marketplace';
import { toast } from '@/lib/toast';

// Une vue comptée au plus une fois par produit et par chargement de page (évite le double
// StrictMode + les refetch). Le backend agrège ces vues pour le tableau de bord vendeur.
const viewed = new Set<string>();

export function BoutiqueDetail({ productId }: { productId: string }) {
    const router = useRouter();
    const client = useApiClient();
    // Fiche produit publique unique (deep-link direct) : plus de scan du catalogue complet.
    const { data: dto, isLoading, error } = useMarketplaceProduct(productId);

    const product = useMemo<MarketplaceItem | null>(() => (dto ? toMarketplaceItem(dto) : null), [dto]);

    // Ping de vue fire-and-forget dès que la fiche existe (statistiques vendeur).
    useEffect(() => {
        if (!product || viewed.has(productId)) return;
        viewed.add(productId);
        void client.marketplace.trackView(productId).catch(() => {});
    }, [client, product, productId]);

    if (isLoading) {
        return (
            <div className="flex h-full flex-col gap-4 bg-background p-5 pt-14">
                <Skeleton className="h-64 w-full rounded-3xl" />
                <Skeleton className="h-6 w-2/3 rounded-full" />
                <Skeleton className="h-4 w-1/3 rounded-full" />
            </div>
        );
    }

    if (!product) {
        // 404 (NOT_FOUND) = pièce non publiée / vendeur non payable → « introuvable ».
        // Toute autre erreur (réseau/serveur) = chargement impossible, distinct de l'absence.
        const notFound = !error || (isApiError(error) && error.code === 'NOT_FOUND');
        return (
            <div className="flex h-full flex-col items-center justify-center gap-4 bg-background px-8 text-center">
                <p className="text-base font-semibold text-foreground">
                    {notFound ? 'Pièce introuvable' : 'Chargement impossible'}
                </p>
                <p className="text-sm text-muted-foreground">
                    {notFound
                        ? 'Cette pièce n’est plus disponible à l’achat.'
                        : 'Impossible d’afficher cette pièce pour le moment. Réessaie.'}
                </p>
                <Link
                    href="/boutique"
                    className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                    Retour à la Boutique
                </Link>
            </div>
        );
    }

    return <DetailBody product={product} onBack={() => router.back()} onBuyNow={() => router.push('/panier')} />;
}

function DetailBody({
    product,
    onBack,
    onBuyNow,
}: {
    product: MarketplaceItem;
    onBack: () => void;
    onBuyNow: () => void;
}) {
    const cart = useCart();
    const [added, setAdded] = useState(false);
    const inCart = cart.some((line) => line.productId === product.id);
    const soldOut = product.stock <= 0;

    const onAdd = useCallback(() => {
        addToCart(product.id, 1);
        setAdded(true);
        toast.success('Ajouté au panier');
        window.setTimeout(() => setAdded(false), 1600);
    }, [product.id]);

    const buyNow = useCallback(() => {
        addToCart(product.id, 1);
        onBuyNow();
    }, [product.id, onBuyNow]);

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

            <div className="relative flex h-72 w-full items-center justify-center bg-muted">
                {product.photoUrl ? (
                    <Image src={product.photoUrl} alt={product.name} fill className="object-cover" unoptimized />
                ) : (
                    <Shirt className="h-16 w-16 text-muted-foreground/25" strokeWidth={1.25} aria-hidden />
                )}
                {product.irisGrade ? (
                    <span className="absolute top-12 right-4">
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
                            <dd className="mt-0.5 text-foreground">{product.category}</dd>
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

                {/* Livraison, retours & garantie — annoncés AVANT l'achat (plus de « frais calculés au paiement »). */}
                <section
                    aria-label="Livraison, retours et garantie"
                    className="flex flex-col divide-y divide-border/50 rounded-2xl border border-border/60 bg-card text-sm"
                >
                    <InfoRow Icon={Truck} label="Livraison">
                        {product.shippingCents === null
                            ? 'Expédiée à domicile.'
                            : product.shippingCents === 0
                              ? 'Offerte — expédiée à domicile.'
                              : `${formatCents(product.shippingCents)} — expédiée à domicile.`}
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

                {product.irisGrade ? <IrisGradeExplainer grade={product.irisGrade} /> : null}
            </div>

            <motion.aside
                aria-label="Acheter cette pièce"
                className="fixed inset-x-0 bottom-[4.75rem] z-40 mx-auto max-w-md border-t border-border/60 bg-background/90 px-4 pt-3 pb-3 backdrop-blur-xl"
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 360, damping: 32, delay: 0.2 }}
            >
                <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                        <p className="font-mono text-xl leading-none font-bold text-foreground">
                            {formatCents(product.priceCents)}
                        </p>
                        <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Truck className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                            {product.shippingCents === null
                                ? 'Livraison à domicile'
                                : product.shippingCents === 0
                                  ? 'Livraison offerte'
                                  : `Livraison ${formatCents(product.shippingCents)}`}
                        </p>
                    </div>
                    {soldOut ? (
                        <span className="text-xs font-semibold text-lumiris-rose">Épuisé</span>
                    ) : product.stock <= 3 ? (
                        <span className="text-[11px] font-medium text-lumiris-amber">
                            Plus que {product.stock} en stock
                        </span>
                    ) : null}
                </div>

                <div className="mt-2.5 flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onAdd}
                        disabled={soldOut}
                        className="h-11 flex-1 rounded-full text-sm font-semibold"
                    >
                        {added || inCart ? (
                            <>
                                <Check className="h-4 w-4" strokeWidth={1.5} />
                                {inCart ? 'Dans le panier' : 'Ajouté'}
                            </>
                        ) : (
                            <>
                                <ShoppingCart className="h-4 w-4" strokeWidth={1.5} />
                                Ajouter
                            </>
                        )}
                    </Button>
                    <Button
                        type="button"
                        onClick={buyNow}
                        disabled={soldOut}
                        className="h-11 flex-[1.4] rounded-full bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                        Acheter — {formatCents(product.priceCents)}
                    </Button>
                </div>
            </motion.aside>
        </div>
    );
}

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

// Explication acheteur du score Iris — libellés FR courts (le badge et l'échelle A→E restent
// alignés sur scoring-ui). Rend la note lisible sur la fiche produit sans jargon.
const IRIS_GRADE_LABEL_FR: Record<NonNullable<MarketplaceItem['irisGrade']>, string> = {
    A: 'exceptionnel',
    B: 'bon',
    C: 'moyen',
    D: 'faible',
    E: 'opaque',
};

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
