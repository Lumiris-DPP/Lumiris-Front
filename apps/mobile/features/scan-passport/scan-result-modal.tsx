'use client';

import Link from 'next/link';
import { ArrowRight, Store } from 'lucide-react';
import { GRADE_LABEL, IrisGrade } from '@lumiris/scoring-ui';
import type { Artisan, Passport, ScoreResult } from '@lumiris/types';
import { useMarketplaceSuggest } from '@lumiris/api-client/react';
import { Sheet, SheetContent, SheetTitle } from '@lumiris/ui/components/sheet';
import { ProductCard } from '@/features/shop/product-card';
import { useOnlineStatus } from '@/lib/network/use-online-status';

interface ScanResultModalProps {
    passport: Passport;
    artisan?: Artisan;
    score: ScoreResult;
    onClose: () => void;
    onOpen: () => void;
}

// LUMIRIS-9 : pour tout DPP scanné en D ou E, on affiche des alternatives artisanales
// (score Iris >= au scan, tri auditable score puis ATELIER+) issues du vrai catalogue.
export function ScanResultModal({ passport, artisan, score, onClose, onOpen }: ScanResultModalProps) {
    const subLabel = `${artisan?.atelierName ?? '—'}${artisan?.city ? ` · ${artisan.city}` : ''}`;
    const showAlternatives = score.grade === 'D' || score.grade === 'E';

    const online = useOnlineStatus();
    const suggest = useMarketplaceSuggest(
        showAlternatives ? { score: score.total, category: passport.garment.kind, grade: score.grade } : null,
    );
    const suggestions = suggest.data?.suggestions ?? [];

    return (
        <Sheet defaultOpen onOpenChange={(open) => (open ? null : onClose())}>
            <SheetContent
                side="bottom"
                className="mx-auto max-h-[82vh] max-w-md overflow-y-auto rounded-t-3xl px-6 pt-8 pb-[max(env(safe-area-inset-bottom),1.5rem)]"
            >
                <SheetTitle className="sr-only">Passeport détecté</SheetTitle>
                <div className="flex flex-col items-center gap-5">
                    <IrisGrade grade={score.grade} size="xl" tone="solid" shape="pill" />
                    <div className="flex flex-col items-center gap-1 text-center">
                        <p className="text-base font-semibold text-foreground">{passport.garment.reference}</p>
                        <p className="text-sm text-muted-foreground">{subLabel}</p>
                        <p className="text-sm text-muted-foreground/80">{GRADE_LABEL[score.grade]}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onOpen}
                        className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-foreground text-sm font-semibold text-background hover:bg-foreground/90"
                    >
                        Ouvrir le passeport
                    </button>
                </div>

                {showAlternatives ? (
                    <section className="mt-6 border-t border-border/60 pt-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Store className="h-4 w-4 text-primary" strokeWidth={1.5} aria-hidden />
                                <h3 className="text-sm font-semibold text-foreground">Alternatives artisanes</h3>
                            </div>
                            <Link
                                href="/boutique"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
                            >
                                Voir le catalogue
                                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                            </Link>
                        </div>
                        <p className="mb-3 text-xs leading-relaxed text-pretty text-muted-foreground">
                            Cette pièce est peu transparente. Voici des alternatives au passeport vérifié, à score Iris
                            égal ou supérieur.
                        </p>

                        {suggest.isPending ? (
                            <SuggestionSkeleton />
                        ) : suggest.isError ? (
                            <SuggestionError online={online} onRetry={() => suggest.refetch()} />
                        ) : suggestions.length > 0 ? (
                            <ul className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
                                {suggestions.map((suggestion, index) => (
                                    <li key={suggestion.item.id} className="w-40 shrink-0 snap-start">
                                        <ProductCard item={suggestion.item} index={index} source="scan-suggest" />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-xs text-muted-foreground">
                                Aucune alternative disponible pour l’instant.
                            </p>
                        )}
                    </section>
                ) : null}
            </SheetContent>
        </Sheet>
    );
}

function SuggestionSkeleton() {
    return (
        <ul className="-mx-1 flex gap-3 overflow-hidden px-1 pb-1">
            {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="w-40 shrink-0">
                    <div className="h-44 animate-pulse rounded-2xl border border-border/60 bg-card" />
                </li>
            ))}
        </ul>
    );
}

// Une erreur réseau ne doit pas se confondre avec « aucune alternative » : sinon un scan D/E
// dont la requête échoue afficherait faussement qu'il n'existe aucune alternative artisanale
// (violation silencieuse du critère « 100 % des D/E ont une suggestion »).
function SuggestionError({ online, onRetry }: { online: boolean; onRetry: () => void }) {
    return (
        <div className="flex flex-col items-start gap-1.5">
            <p className="text-xs text-muted-foreground">
                {online
                    ? 'Impossible de charger les alternatives pour le moment.'
                    : 'Vous êtes hors-ligne — les alternatives nécessitent une connexion.'}
            </p>
            {online ? (
                <button
                    type="button"
                    onClick={onRetry}
                    className="text-xs font-semibold text-foreground underline-offset-4 hover:underline"
                >
                    Réessayer
                </button>
            ) : null}
        </div>
    );
}
