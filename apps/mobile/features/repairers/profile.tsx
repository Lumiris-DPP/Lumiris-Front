'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, MessageSquarePlus, Star, Wrench } from 'lucide-react';
import { isApiError, useAddRepairerReview, useRepairerReviews } from '@lumiris/api-client/react';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import type { PublicRepairerDto, RepairerReviewDto } from '@/lib/public-repairer-api';

interface RepairerProfileProps {
    repairer: PublicRepairerDto;
    reviews: readonly RepairerReviewDto[];
}

export function RepairerProfile({ repairer, reviews: initialReviews }: RepairerProfileProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const forParam = searchParams.get('for');
    const title = repairer.companyName ?? repairer.displayName ?? 'Retoucheur';

    const normalizedInitialReviews = useMemo(
        () =>
            initialReviews.map((r) => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment ?? undefined,
                reviewerName: r.reviewerName ?? undefined,
                createdAt: r.createdAt,
            })),
        [initialReviews],
    );
    const { data: reviews = normalizedInitialReviews } = useRepairerReviews(repairer.id, {
        initialData: normalizedInitialReviews,
    });
    const addReview = useAddRepairerReview(repairer.id);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [rating, setRating] = useState(5);
    const [reviewerName, setReviewerName] = useState('');
    const [comment, setComment] = useState('');
    const [reviewError, setReviewError] = useState<string | null>(null);

    const requestHref = useMemo(() => {
        const base = `/retoucheurs/${repairer.id}/request`;
        return forParam ? `${base}?for=${encodeURIComponent(forParam)}` : base;
    }, [repairer.id, forParam]);

    function handleReviewSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (reviewerName.trim().length === 0) {
            setReviewError('Indique ton nom pour publier ton avis.');
            return;
        }
        setReviewError(null);
        addReview.mutate(
            { rating, reviewerName: reviewerName.trim(), comment: comment.trim() || undefined },
            {
                onSuccess: () => {
                    setShowReviewForm(false);
                    setRating(5);
                    setReviewerName('');
                    setComment('');
                },
                onError: (err) => setReviewError(isApiError(err) ? err.message : "Impossible d'envoyer ton avis."),
            },
        );
    }

    return (
        <div className="bg-background flex h-full flex-col overflow-y-auto pb-24">
            <motion.header
                className="flex items-center gap-3 px-4 pb-3 pt-12"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <button
                    type="button"
                    onClick={() => router.push(forParam ? `/local?for=${encodeURIComponent(forParam)}` : '/local')}
                    aria-label="Retour"
                    className="border-border bg-card text-foreground inline-flex h-9 w-9 items-center justify-center rounded-full border"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                    <h1 className="text-foreground truncate text-base font-bold">{title}</h1>
                    {repairer.city ? (
                        <p className="text-muted-foreground truncate text-xs">
                            {repairer.city}
                            {repairer.region ? ` · ${repairer.region}` : ''}
                        </p>
                    ) : null}
                </div>
            </motion.header>

            <div className="flex flex-col gap-5 px-4">
                <section className="border-border/60 bg-card flex flex-col gap-3 rounded-3xl border p-5">
                    <div className="min-w-0">
                        <p className="text-foreground truncate text-base font-semibold">{title}</p>
                        {repairer.address ? (
                            <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                                <MapPin className="h-3 w-3" />
                                {repairer.address}
                            </p>
                        ) : null}
                    </div>

                    {repairer.averageRating != null ? (
                        <div className="flex items-center gap-3 text-xs">
                            <span className="inline-flex items-center gap-1">
                                <Star className="text-lumiris-amber h-3.5 w-3.5 fill-current" />
                                <span className="text-foreground font-semibold">
                                    {repairer.averageRating.toFixed(1)}
                                </span>
                                <span className="text-muted-foreground">({repairer.reviewCount})</span>
                            </span>
                        </div>
                    ) : null}

                    {repairer.schedule ? (
                        <p className="text-muted-foreground text-[11px]">{repairer.schedule}</p>
                    ) : null}
                </section>

                {repairer.specialties && repairer.specialties.length > 0 ? (
                    <section className="flex flex-col gap-2">
                        <h2 className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
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
                        <h2 className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                            Zones desservies
                        </h2>
                        <p className="text-foreground/90 text-sm">{repairer.zones.join(', ')}</p>
                    </section>
                ) : null}

                <section className="flex flex-col gap-2">
                    <Link
                        href={requestHref}
                        className="bg-foreground text-primary-foreground inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold active:scale-95"
                    >
                        <Wrench className="h-4 w-4" />
                        Envoyer une demande
                    </Link>
                    <p className="text-muted-foreground/80 mt-1 text-center text-[10px]">
                        Le retoucheur te répondra avec un devis directement dans l&apos;application.
                    </p>
                </section>

                <section className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                            Avis ({reviews.length})
                        </h2>
                        {!showReviewForm ? (
                            <button
                                type="button"
                                onClick={() => setShowReviewForm(true)}
                                className="text-lumiris-cyan inline-flex items-center gap-1 text-[11px] font-medium"
                            >
                                <MessageSquarePlus className="h-3.5 w-3.5" />
                                Laisser un avis
                            </button>
                        ) : null}
                    </div>

                    {showReviewForm ? (
                        <form
                            onSubmit={handleReviewSubmit}
                            className="border-border/60 bg-card flex flex-col gap-3 rounded-2xl border p-3"
                        >
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((value) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setRating(value)}
                                        aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
                                        className="p-0.5"
                                    >
                                        <Star
                                            className={`h-5 w-5 ${
                                                value <= rating
                                                    ? 'text-lumiris-amber fill-current'
                                                    : 'text-muted-foreground/40'
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="review-name" className="text-[11px]">
                                    Ton nom
                                </Label>
                                <Input
                                    id="review-name"
                                    value={reviewerName}
                                    onChange={(e) => setReviewerName(e.target.value)}
                                    placeholder="Camille"
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="review-comment" className="text-[11px]">
                                    Commentaire (optionnel)
                                </Label>
                                <textarea
                                    id="review-comment"
                                    aria-label="Commentaire (optionnel)"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={3}
                                    placeholder="Ton expérience avec ce retoucheur…"
                                    className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:ring-lumiris-cyan/30 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
                                />
                            </div>
                            {reviewError ? (
                                <p className="text-destructive text-xs" role="alert">
                                    {reviewError}
                                </p>
                            ) : null}
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowReviewForm(false)}
                                >
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={addReview.isPending} className="flex-1">
                                    {addReview.isPending ? 'Envoi…' : 'Publier'}
                                </Button>
                            </div>
                        </form>
                    ) : null}

                    {reviews.length > 0 ? (
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
                    ) : !showReviewForm ? (
                        <p className="text-muted-foreground/70 text-xs italic">Aucun avis pour l&apos;instant.</p>
                    ) : null}
                </section>
            </div>
        </div>
    );
}
