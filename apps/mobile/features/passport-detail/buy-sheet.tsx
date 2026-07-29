'use client';

import { ExternalLink, Store } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@lumiris/ui/components/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@lumiris/ui/components/sheet';
import type { Passport } from '@lumiris/types';
import type { ArtisanWithSlug } from '@lumiris/mock-data';
import { useTrackAffiliate } from '@lumiris/api-client/react';
import { routes } from '@/lib/routes';
import { trackAffiliateClick } from '@/lib/affiliate/track';
import { useOnlineStatus } from '@/lib/network/use-online-status';

interface BuySheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    passport: Passport;
    artisan: ArtisanWithSlug;
}

export function BuySheet({ open, onOpenChange, passport, artisan }: BuySheetProps) {
    const websiteUrl = artisan.websiteUrl;
    const online = useOnlineStatus();
    const track = useTrackAffiliate();

    const onGoToWebsite = () => {
        if (!websiteUrl || !online) return;
        // Journal local (historique) + tracking serveur via /public/track/affiliate.
        trackAffiliateClick({
            source: 'passport-buy',
            passportId: passport.id,
            artisanId: artisan.id,
            websiteUrl,
        });
        track.mutate({ source: 'passport-buy', targetUrl: websiteUrl });
        onOpenChange(false);
    };

    const formattedPrice = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: passport.garment.currency === 'EUR' ? 'EUR' : 'USD',
        maximumFractionDigits: 0,
    }).format(passport.garment.retailPrice);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="mx-auto max-h-[85vh] max-w-md overflow-y-auto rounded-t-2xl pb-8">
                <SheetHeader className="pt-5 pb-3">
                    <SheetTitle className="text-base text-foreground">Acheter chez l&apos;atelier</SheetTitle>
                    <SheetDescription>Achat direct, sans intermédiaire.</SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-4 px-4">
                    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                            <Store className="h-5 w-5" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">{artisan.atelierName}</p>
                            <p className="truncate text-xs text-muted-foreground">
                                {passport.garment.reference} · {artisan.city}
                            </p>
                        </div>
                        <p className="shrink-0 font-mono text-base font-semibold text-foreground">{formattedPrice}</p>
                    </div>

                    <p className="text-sm leading-relaxed text-foreground/90">
                        Achat direct depuis l&apos;atelier - pas d&apos;intermédiaire. LUMIRIS prélève une commission
                        d&apos;affiliation transparente.
                    </p>

                    {websiteUrl ? (
                        online ? (
                            <a
                                href={websiteUrl}
                                target="_blank"
                                rel="sponsored noopener noreferrer"
                                onClick={onGoToWebsite}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-primary-foreground active:scale-95"
                            >
                                <ExternalLink className="h-4 w-4" aria-hidden />
                                Aller sur le site de l&apos;atelier
                            </a>
                        ) : (
                            <button
                                type="button"
                                disabled
                                aria-disabled
                                className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-full bg-muted px-5 py-3 text-sm font-semibold text-muted-foreground opacity-70"
                            >
                                <ExternalLink className="h-4 w-4" aria-hidden />
                                Indisponible hors-ligne
                            </button>
                        )
                    ) : (
                        <p className="rounded-xl border border-dashed border-current/30 px-4 py-3 text-center text-xs text-muted-foreground">
                            Cet atelier n&apos;a pas (encore) de boutique en ligne.
                        </p>
                    )}

                    <Button asChild variant="outline" className="w-full rounded-full">
                        <Link href={routes.artisan(artisan.slug)} onClick={() => onOpenChange(false)}>
                            Voir l&apos;atelier sur LUMIRIS
                        </Link>
                    </Button>

                    <p className="text-center text-[11px] text-muted-foreground">
                        Commission 3-7% -{' '}
                        <Link href="/about" className="underline-offset-4 hover:underline">
                            voir À propos
                        </Link>
                    </p>
                </div>
            </SheetContent>
        </Sheet>
    );
}
