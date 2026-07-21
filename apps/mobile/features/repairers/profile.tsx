'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Star, Wrench } from 'lucide-react';
import { Badge } from '@lumiris/ui/components/badge';
import type { PublicRepairerDto, RepairerReviewDto } from '@/lib/public-repairer-api';

interface RepairerProfileProps {
    repairer: PublicRepairerDto;
    reviews: readonly RepairerReviewDto[];
}

export function RepairerProfile({ repairer, reviews }: RepairerProfileProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const forParam = searchParams.get('for');
    const title = repairer.companyName ?? repairer.displayName ?? 'Retoucheur';

    const requestHref = useMemo(() => {
        const base = `/retoucheurs/${repairer.id}/request`;
        return forParam ? `${base}?for=${encodeURIComponent(forParam)}` : base;
    }, [repairer.id, forParam]);

    return (
        <div className="flex h-full flex-col overflow-y-auto bg-background pb-24">
            <motion.header
                className="flex items-center gap-3 px-4 pt-12 pb-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <button
                    type="button"
                    onClick={() => router.push(forParam ? `/local?for=${encodeURIComponent(forParam)}` : '/local')}
                    aria-label="Retour"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-base font-bold text-foreground">{title}</h1>
                    {repairer.city ? (
                        <p className="truncate text-xs text-muted-foreground">
                            {repairer.city}
                            {repairer.region ? ` · ${repairer.region}` : ''}
                        </p>
                    ) : null}
                </div>
            </motion.header>

            <div className="flex flex-col gap-5 px-4">
                <section className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-card p-5">
                    <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-foreground">{title}</p>
                        {repairer.address ? (
                            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {repairer.address}
                            </p>
                        ) : null}
                    </div>

                    {repairer.averageRating != null ? (
                        <div className="flex items-center gap-3 text-xs">
                            <span className="inline-flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 fill-current text-lumiris-amber" />
                                <span className="font-semibold text-foreground">
                                    {repairer.averageRating.toFixed(1)}
                                </span>
                                <span className="text-muted-foreground">({repairer.reviewCount})</span>
                            </span>
                        </div>
                    ) : null}

                    {repairer.schedule ? (
                        <p className="text-[11px] text-muted-foreground">{repairer.schedule}</p>
                    ) : null}
                </section>

                {repairer.specialties && repairer.specialties.length > 0 ? (
                    <section className="flex flex-col gap-2">
                        <h2 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Spécialités
                        </h2>
                        <ul className="flex flex-wrap gap-1.5">
                            {repairer.specialties.map((s) => (
                                <li key={s}>
                                    <Badge variant="secondary" className="text-[11px]">
                                        {s}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    </section>
                ) : null}

                {repairer.zones && repairer.zones.length > 0 ? (
                    <section className="flex flex-col gap-2">
                        <h2 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Zones desservies
                        </h2>
                        <p className="text-sm text-foreground/90">{repairer.zones.join(', ')}</p>
                    </section>
                ) : null}

                <section className="flex flex-col gap-2">
                    <Link
                        href={requestHref}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-primary-foreground active:scale-95"
                    >
                        <Wrench className="h-4 w-4" />
                        Envoyer une demande
                    </Link>
                    <p className="mt-1 text-center text-[10px] text-muted-foreground/80">
                        Le retoucheur te répondra avec un devis directement dans l&apos;application.
                    </p>
                </section>

                {reviews.length > 0 ? (
                    <section className="flex flex-col gap-2">
                        <h2 className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                            Avis ({reviews.length})
                        </h2>
                        <ul className="flex flex-col gap-2">
                            {reviews.map((r) => (
                                <li key={r.id} className="border-border/60 bg-card rounded-2xl border p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-foreground text-xs font-semibold">
                                            {r.reviewerName ?? 'Client LUMIRIS'}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-xs">
                                            <Star className="text-lumiris-amber h-3 w-3 fill-current" />
                                            {r.rating}
                                        </span>
                                    </div>
                                    {r.comment ? (
                                        <p className="text-muted-foreground mt-1 text-[12px] leading-relaxed">
                                            {r.comment}
                                        </p>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    </section>
                ) : null}
            </div>
        </div>
    );
}
