'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CalendarClock, ExternalLink, Handshake, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@lumiris/ui/components/button';
import { signalArtisanInterest, type ArtisanPublicProfileDto } from '@/lib/public-artisan-api';
import { toast } from '@/lib/toast';

export function ArtisanPublicProfile({ artisan }: { artisan: ArtisanPublicProfileDto }) {
    const router = useRouter();
    const title = artisan.atelierName ?? artisan.displayName ?? 'Atelier';
    const [interestSent, setInterestSent] = useState(false);
    const [sendingInterest, setSendingInterest] = useState(false);

    function handleSignalInterest() {
        setSendingInterest(true);
        signalArtisanInterest(artisan.slug)
            .then(() => {
                setInterestSent(true);
                toast.success('Merci ! On les préviendra que vous les cherchez.');
            })
            .catch(() => toast.error('Un souci est survenu, réessaie plus tard.'))
            .finally(() => setSendingInterest(false));
    }

    return (
        <div className="flex h-full flex-col overflow-y-auto bg-background pb-24">
            <motion.header
                className="flex items-center gap-3 px-4 pt-12 pb-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <button
                    type="button"
                    onClick={() => router.back()}
                    aria-label="Retour"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-base font-bold text-foreground">{title}</h1>
                    {artisan.city ? (
                        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {artisan.city}
                            {artisan.region ? ` · ${artisan.region}` : ''}
                        </p>
                    ) : null}
                </div>
            </motion.header>

            {!artisan.claimed ? (
                <section className="mx-4 mb-2 flex flex-col items-center gap-2 rounded-3xl border border-lumiris-amber/30 bg-lumiris-amber/5 p-5 text-center">
                    <Handshake className="h-6 w-6 text-lumiris-amber" aria-hidden />
                    <p className="text-sm font-semibold text-foreground">
                        Cet atelier ne fait pas encore partie du réseau Lumiris
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                        Ses passeports ne sont pas encore disponibles ici. Signale-nous que tu le cherches, on
                        l&apos;invitera à nous rejoindre.
                    </p>
                    <Button
                        type="button"
                        size="sm"
                        disabled={interestSent || sendingInterest}
                        onClick={handleSignalInterest}
                        className="mt-1 bg-lumiris-amber text-white hover:bg-lumiris-amber/90"
                    >
                        {interestSent ? 'Merci, on s’en occupe !' : 'Inviter dans le réseau'}
                    </Button>
                </section>
            ) : null}

            {artisan.pausedUntil ? (
                <div className="mx-4 mb-2 flex items-start gap-2 rounded-2xl border border-lumiris-cyan/30 bg-lumiris-cyan/10 p-3">
                    <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lumiris-cyan" aria-hidden />
                    <p className="text-xs text-foreground">
                        Atelier en pause — de retour le {formatArtisanDate(artisan.pausedUntil)}. Ses pièces restent
                        achetables, avec un délai d&apos;expédition allongé.
                    </p>
                </div>
            ) : null}

            <div className="flex flex-col gap-5 px-4">
                {artisan.photoUrls.length > 0 ? (
                    <div className="flex gap-2 overflow-x-auto">
                        {artisan.photoUrls.map((url) => (
                            <div key={url} className="relative h-40 w-40 shrink-0 overflow-hidden rounded-xl">
                                <Image src={url} alt={title} fill sizes="160px" className="object-cover" />
                            </div>
                        ))}
                    </div>
                ) : null}

                {artisan.specialties && artisan.specialties.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                        {artisan.specialties.map((s) => (
                            <span
                                key={s}
                                className="rounded-md bg-lumiris-emerald/10 px-2 py-1 text-xs text-lumiris-emerald"
                            >
                                {s}
                            </span>
                        ))}
                    </div>
                ) : null}

                {artisan.story ? (
                    <section>
                        <h2 className="mb-1 text-sm font-semibold text-foreground">Histoire</h2>
                        <p className="text-sm leading-relaxed text-foreground/90">{artisan.story}</p>
                    </section>
                ) : null}

                {artisan.method ? (
                    <section>
                        <h2 className="mb-1 text-sm font-semibold text-foreground">Méthode</h2>
                        <p className="text-sm leading-relaxed text-foreground/90">{artisan.method}</p>
                    </section>
                ) : null}

                {artisan.journey ? (
                    <section>
                        <h2 className="mb-1 text-sm font-semibold text-foreground">Parcours</h2>
                        <p className="text-sm leading-relaxed text-foreground/90">{artisan.journey}</p>
                    </section>
                ) : null}

                {artisan.links && Object.keys(artisan.links).length > 0 ? (
                    <section className="flex flex-col gap-1.5">
                        {Object.entries(artisan.links).map(([label, url]) => (
                            <a
                                key={label}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm text-lumiris-emerald hover:underline"
                            >
                                {label} <ExternalLink className="h-3 w-3" />
                            </a>
                        ))}
                    </section>
                ) : null}

                {artisan.websiteUrl ? (
                    <a
                        href={artisan.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-lumiris-emerald hover:underline"
                    >
                        Site externe <ExternalLink className="h-3 w-3" />
                    </a>
                ) : null}
            </div>
        </div>
    );
}

function formatArtisanDate(value: string): string {
    return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}
