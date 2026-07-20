'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, BadgeCheck, Check, MapPin, Shirt, ShoppingCart, Truck } from 'lucide-react';
import { useApiClient, useMarketplaceSearch } from '@lumiris/api-client/react';
import { IrisGrade } from '@lumiris/scoring-ui';
import { Button } from '@lumiris/ui/components/button';
import { Skeleton } from '@lumiris/ui/components/skeleton';
import { addToCart, formatEur, toMarketplaceItem, useCart, type MarketplaceItem } from '@/lib/marketplace';
import { toast } from '@/lib/toast';

// Une vue comptée au plus une fois par produit et par chargement de page (évite le double
// StrictMode + les refetch). Le backend agrège ces vues pour le tableau de bord vendeur.
const viewed = new Set<string>();

export function BoutiqueDetail({ productId }: { productId: string }) {
    const router = useRouter();
    const client = useApiClient();
    const { data, isLoading } = useMarketplaceSearch();

    const product = useMemo<MarketplaceItem | null>(() => {
        const dto = data?.items.find((p) => p.id === productId);
        return dto ? toMarketplaceItem(dto) : null;
    }, [data, productId]);

    // Ping de vue fire-and-forget dès que la fiche existe (statistiques vendeur).
    useEffect(() => {
        if (!product || viewed.has(productId)) return;
        viewed.add(productId);
        void client.marketplace.trackView(productId).catch(() => {});
    }, [client, product, productId]);

    if (isLoading) {
        return (
            <div className="bg-background flex h-full flex-col gap-4 p-5 pt-14">
                <Skeleton className="h-64 w-full rounded-3xl" />
                <Skeleton className="h-6 w-2/3 rounded-full" />
                <Skeleton className="h-4 w-1/3 rounded-full" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="bg-background flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
                <p className="text-foreground text-base font-semibold">Pièce introuvable</p>
                <p className="text-muted-foreground text-sm">Cette pièce n&apos;est plus disponible à l&apos;achat.</p>
                <Link
                    href="/boutique"
                    className="bg-foreground text-primary-foreground inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
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
        <div className="bg-background relative flex h-full flex-col overflow-y-auto pb-36">
            <button
                type="button"
                onClick={onBack}
                aria-label="Retour"
                className="border-border bg-card/90 text-foreground absolute left-4 top-12 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur"
            >
                <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="bg-muted relative flex h-72 w-full items-center justify-center">
                {product.photoUrl ? (
                    <Image src={product.photoUrl} alt={product.name} fill className="object-cover" unoptimized />
                ) : (
                    <Shirt className="text-muted-foreground/25 h-16 w-16" strokeWidth={1.25} aria-hidden />
                )}
                {product.irisGrade ? (
                    <span className="absolute right-4 top-12">
                        <IrisGrade grade={product.irisGrade} size="md" tone="solid" />
                    </span>
                ) : null}
            </div>

            <div className="flex flex-col gap-4 px-5 pt-5">
                <div>
                    <span className="border-primary/20 bg-primary/5 text-primary inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold">
                        <BadgeCheck className="h-3 w-3" strokeWidth={1.5} aria-hidden />
                        Passeport Lumiris vérifié
                    </span>
                    <h1 className="text-foreground mt-2 text-balance text-xl font-bold leading-tight">
                        {product.name}
                    </h1>
                    <p className="text-muted-foreground mt-0.5 text-sm">Vendu par {product.artisanName}</p>
                </div>

                {product.description ? (
                    <p className="text-foreground/90 text-sm leading-relaxed">{product.description}</p>
                ) : null}

                <dl className="border-border/60 bg-card grid grid-cols-2 gap-3 rounded-2xl border p-4 text-sm">
                    {product.material ? (
                        <div>
                            <dt className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                                Matière
                            </dt>
                            <dd className="text-foreground mt-0.5">{product.material}</dd>
                        </div>
                    ) : null}
                    {product.category ? (
                        <div>
                            <dt className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                                Catégorie
                            </dt>
                            <dd className="text-foreground mt-0.5">{product.category}</dd>
                        </div>
                    ) : null}
                    {product.originCountry ? (
                        <div>
                            <dt className="text-muted-foreground inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider">
                                <MapPin className="h-3 w-3" aria-hidden />
                                Origine
                            </dt>
                            <dd className="text-foreground mt-0.5">{product.originCountry}</dd>
                        </div>
                    ) : null}
                    {product.dppFormId ? (
                        <div>
                            <dt className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                                Traçabilité
                            </dt>
                            <dd className="text-foreground mt-0.5">Passeport numérique complet</dd>
                        </div>
                    ) : null}
                </dl>
            </div>

            <motion.aside
                aria-label="Acheter cette pièce"
                className="border-border/60 bg-background/90 fixed inset-x-0 bottom-[4.75rem] z-40 mx-auto max-w-md border-t px-4 pb-3 pt-3 backdrop-blur-xl"
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 360, damping: 32, delay: 0.2 }}
            >
                <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-foreground font-mono text-xl font-bold leading-none">
                            {formatEur(product.price)}
                        </p>
                        <p className="text-muted-foreground mt-1 inline-flex items-center gap-1 text-[11px]">
                            <Truck className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                            Livraison à domicile · frais calculés au paiement
                        </p>
                    </div>
                    {soldOut ? (
                        <span className="text-lumiris-rose text-xs font-semibold">Épuisé</span>
                    ) : product.stock <= 3 ? (
                        <span className="text-lumiris-amber text-[11px] font-medium">
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
                        className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 flex-[1.4] rounded-full text-sm font-semibold"
                    >
                        Acheter — {formatEur(product.price)}
                    </Button>
                </div>
            </motion.aside>
        </div>
    );
}
