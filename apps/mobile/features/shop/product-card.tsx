'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ExternalLink, ShoppingBag, Shirt } from 'lucide-react';
import { IrisGrade } from '@lumiris/scoring-ui';
import type { IrisGrade as IrisGradeValue } from '@lumiris/types';
import { useTrackAffiliate } from '@lumiris/api-client/react';
import type { MarketplaceItem } from '@lumiris/api-client';
import { cn } from '@lumiris/ui/lib/cn';
import { routes } from '@/lib/routes';
import { formatCents } from '@/lib/marketplace';
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

// Carte du catalogue réel. Deux modes :
//  • vente in-app → renvoie vers la fiche Boutique qui porte le VRAI flux
//    panier + paiement embarqué (aucun paiement direct au clic) ;
//  • affilié → ouvre le lien de commande de l'atelier, tracké via /public/track/affiliate.
export function ProductCard({ item, index, source = 'shop' }: ProductCardProps) {
    const track = useTrackAffiliate();
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

    const body = (
        <>
            <div className="relative flex h-28 items-center justify-center overflow-hidden bg-secondary/50">
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
                    <Shirt className="h-9 w-9 text-muted-foreground/25" aria-hidden />
                )}
                {grade ? (
                    <span className="absolute top-2 right-2">
                        <IrisGrade grade={grade} size="sm" tone="solid" />
                    </span>
                ) : null}
                {item.atelierPlus ? <AtelierPlusBadge className="absolute top-2 left-2" /> : null}
            </div>

            <div className="p-3">
                <h4 className="truncate text-xs leading-tight font-semibold text-foreground">{item.name}</h4>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {item.artisanName ?? 'Atelier indépendant'}
                    {item.material ? ` · ${materialLabel(item.material)}` : ''}
                </p>
                <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-foreground">{formatCents(item.priceCents)}</p>
                    {inApp ? (
                        <ShoppingBag className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
                    ) : href ? (
                        <ExternalLink
                            className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                            strokeWidth={1.5}
                            aria-hidden
                        />
                    ) : null}
                </div>
            </div>
        </>
    );

    const className = cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border bg-card text-left transition-all',
        'border-border/60 hover:border-border',
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + index * 0.03 }}
        >
            {inApp ? (
                <Link
                    href={routes.product(item.id)}
                    className={className}
                    aria-label={`Voir « ${item.name} » dans la Boutique`}
                >
                    {body}
                </Link>
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
