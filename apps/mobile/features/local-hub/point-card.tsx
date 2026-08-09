'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { MapPin, Star, Store, Wrench } from 'lucide-react';
import { cn } from '@lumiris/ui/lib/cn';
import type { LocalPoint } from './types';
import { routes } from '@/lib/routes';

interface PointCardProps {
    point: LocalPoint;
    index: number;
}

export function PointCard({ point, index }: PointCardProps) {
    const prefersReduced = useReducedMotion();
    const searchParams = useSearchParams();
    const isArtisan = point.kind === 'artisan';
    // Conserve le contexte "réparer ce passeport" (?for=) jusqu'au profil retoucheur.
    const forParam = searchParams.get('for');
    const forQuery = !isArtisan && forParam ? `?for=${encodeURIComponent(forParam)}` : '';
    const href = isArtisan ? routes.artisan(point.slug) : `/retoucheurs/${point.slug}${forQuery}`;
    const typeLabel = isArtisan ? 'Atelier' : 'Retoucheur';
    const chips = point.specialties?.slice(0, 3) ?? [];
    const extraChips = (point.specialties?.length ?? 0) - chips.length;
    const ariaLabel = `${typeLabel} ${point.name}, ${point.city}${point.distanceKm !== undefined ? `, à ${formatDistance(point.distanceKm)}` : ''}`;

    return (
        <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(0.04 * index, 0.2) }}
        >
            <Link
                href={href}
                aria-label={ariaLabel}
                className={cn(
                    'opal-shadow border-border/60 bg-card group relative flex gap-3 rounded-2xl border p-3.5',
                    'transition-colors active:scale-[0.99]',
                    'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    'hover:border-border',
                )}
            >
                <Thumb point={point} isArtisan={isArtisan} />

                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className="text-foreground line-clamp-1 text-[15px] font-semibold leading-tight">
                                {point.name}
                            </h3>
                            <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                                {typeLabel} · {point.city}
                            </p>
                        </div>
                        {point.distanceKm !== undefined ? (
                            <span className="text-muted-foreground inline-flex shrink-0 items-center gap-1 text-[11px] font-medium">
                                <MapPin className="h-3 w-3" strokeWidth={1.5} aria-hidden />
                                <span className="font-mono tabular-nums">{formatDistance(point.distanceKm)}</span>
                            </span>
                        ) : null}
                    </div>

                    {chips.length > 0 ? (
                        <ul className="flex flex-wrap gap-1">
                            {chips.map((chip) => (
                                <li
                                    key={chip}
                                    className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-medium"
                                >
                                    {chip}
                                </li>
                            ))}
                            {extraChips > 0 ? (
                                <li className="text-muted-foreground/70 px-1 py-0.5 text-[10px] font-medium">
                                    +{extraChips}
                                </li>
                            ) : null}
                        </ul>
                    ) : null}

                    <KpiRow point={point} isArtisan={isArtisan} />
                </div>
            </Link>
        </motion.div>
    );
}

function Thumb({ point, isArtisan }: { point: LocalPoint; isArtisan: boolean }) {
    if (isArtisan && point.photoUrl) {
        return (
            <div className="bg-muted relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                <Image
                    src={point.photoUrl}
                    alt={`Atelier ${point.name}`}
                    fill
                    unoptimized
                    sizes="64px"
                    className="object-cover"
                />
            </div>
        );
    }
    const Icon = isArtisan ? Store : Wrench;
    return (
        <div
            className={cn(
                'flex h-16 w-16 shrink-0 items-center justify-center rounded-xl',
                isArtisan ? 'bg-lumiris-emerald/10 text-lumiris-emerald' : 'bg-lumiris-cyan/10 text-lumiris-cyan',
            )}
            role="img"
            aria-label={`${isArtisan ? 'Atelier' : 'Retoucheur'} ${point.name}`}
        >
            <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden />
        </div>
    );
}

function KpiRow({ point, isArtisan }: { point: LocalPoint; isArtisan: boolean }) {
    if (isArtisan || point.rating === undefined) return null;

    return (
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
            <span className="inline-flex items-center gap-1">
                <Star className="text-lumiris-amber h-3.5 w-3.5 fill-current" strokeWidth={1.5} aria-hidden />
                <span className="text-foreground font-mono font-semibold tabular-nums">{point.rating.toFixed(1)}</span>
                {point.reviewCount !== undefined ? (
                    <span className="text-muted-foreground font-mono tabular-nums">({point.reviewCount})</span>
                ) : null}
            </span>
        </div>
    );
}

function formatDistance(km: number): string {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    if (km < 10) return `${km.toFixed(1)} km`;
    return `${Math.round(km)} km`;
}
