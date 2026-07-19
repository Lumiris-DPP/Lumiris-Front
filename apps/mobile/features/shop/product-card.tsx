'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, ShoppingBag, Shirt } from 'lucide-react';
import { IrisGrade } from '@lumiris/scoring-ui';
import type { IrisGrade as IrisGradeValue } from '@lumiris/types';
import { useBuyProduct, useTrackAffiliate } from '@lumiris/api-client/react';
import type { MarketplaceItem } from '@lumiris/api-client';
import { cn } from '@lumiris/ui/lib/cn';
import { formatPriceCents } from '@lumiris/utils';
import { AtelierPlusBadge } from './atelier-plus-badge';
import { materialLabel } from './labels';

const GRADES: readonly IrisGradeValue[] = ['A', 'B', 'C', 'D', 'E'];

function asGrade(value?: string | null): IrisGradeValue | null {
    return value && GRADES.includes(value as IrisGradeValue) ? (value as IrisGradeValue) : null;
}

// N'ouvre un lien externe que s'il est http(s) — barrière anti-XSS (javascript:/data:)
// en défense en profondeur, en plus de la validation backend.
function safeHttpUrl(url?: string | null): string | undefined {
    if (!url) return undefined;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? url : undefined;
    } catch {
        return undefined;
    }
}

interface ProductCardProps {
    item: MarketplaceItem;
    index: number;
    /** Origine du clic d'affiliation : `shop` (catalogue) ou `scan-suggest` (alternative scan). */
    source?: string;
}

// Carte du catalogue réel (LUMIRIS-9). Le clic vers le lien de commande de l'atelier
// est tracké via /public/track/affiliate (fire-and-forget) avant d'ouvrir l'onglet externe.
export function ProductCard({ item, index, source = 'shop' }: ProductCardProps) {
    const track = useTrackAffiliate();
    const buy = useBuyProduct();
    const grade = asGrade(item.irisGrade);
    const href = safeHttpUrl(item.externalOrderUrl);
    const inApp = item.inAppSale === true;
    // photoUrl passe par la même barrière http(s) que le lien de commande (défense en profondeur) ;
    // repli sur l'icône si l'URL est absente/refusée ou si le chargement échoue (ex. CSP Tauri).
    const photo = safeHttpUrl(item.photoUrl);
    const [photoFailed, setPhotoFailed] = useState(false);

    const onOrderClick = () => {
        if (!href) return;
        track.mutate({ source, productId: item.id, targetUrl: href });
    };

    const onBuy = () => {
        if (buy.isPending) return;
        buy.mutate(item.id, {
            onSuccess: ({ url }) => {
                window.location.href = url;
            },
        });
    };

    const body = (
        <>
            <div className="bg-secondary/50 relative flex h-28 items-center justify-center overflow-hidden">
                {photo && !photoFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={photo}
                        alt=""
                        loading="lazy"
                        onError={() => setPhotoFailed(true)}
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                ) : (
                    <Shirt className="text-muted-foreground/25 h-9 w-9" aria-hidden />
                )}
                {grade ? (
                    <span className="absolute right-2 top-2">
                        <IrisGrade grade={grade} size="sm" tone="solid" />
                    </span>
                ) : null}
                {item.atelierPlus ? <AtelierPlusBadge className="absolute left-2 top-2" /> : null}
            </div>

            <div className="p-3">
                <h4 className="text-foreground truncate text-xs font-semibold leading-tight">{item.name}</h4>
                <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
                    {item.artisanName ?? 'Atelier indépendant'}
                    {item.material ? ` · ${materialLabel(item.material)}` : ''}
                </p>
                <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="text-foreground text-xs font-bold">
                        {formatPriceCents(item.priceCents, item.currency)}
                    </p>
                    {inApp ? (
                        <ShoppingBag className="text-primary h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                    ) : href ? (
                        <ExternalLink
                            className="text-muted-foreground h-3.5 w-3.5 shrink-0"
                            strokeWidth={1.5}
                            aria-hidden
                        />
                    ) : null}
                </div>
            </div>
        </>
    );

    const className = cn(
        'bg-card group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all',
        'border-border/60 hover:border-border',
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + index * 0.03 }}
        >
            {inApp ? (
                <button
                    type="button"
                    onClick={onBuy}
                    disabled={buy.isPending}
                    className={cn(className, 'disabled:opacity-60')}
                    aria-label={`Acheter « ${item.name} » (paiement in-app)`}
                >
                    {body}
                </button>
            ) : href ? (
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    onClick={onOrderClick}
                    className={className}
                    aria-label={`Commander « ${item.name} » chez ${item.artisanName ?? "l'atelier"}`}
                >
                    {body}
                </a>
            ) : (
                <div className={className}>{body}</div>
            )}
        </motion.div>
    );
}
