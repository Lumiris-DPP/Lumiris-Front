'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Award, ExternalLink, MapPin } from 'lucide-react';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import type { ArtisanProfileResponse } from '@lumiris/api-client';

interface Props {
    profile: ArtisanProfileResponse;
}

export function VitrinePreview({ profile }: Props) {
    const name = profile.atelierName ?? profile.userName ?? 'Atelier';

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
                <Button asChild size="sm" variant="ghost">
                    <Link href="/profile">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Retour à l&apos;édition
                    </Link>
                </Button>
                <p className="text-xs text-muted-foreground">
                    {profile.published ? 'Aperçu de votre vitrine publiée' : 'Aperçu — vitrine non encore publiée'}
                </p>
            </header>

            <article className="pt-10 pb-20">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
                        {profile.photos[0] ? (
                            <Image
                                src={profile.photos[0].url}
                                alt={`Portrait de ${name}`}
                                width={160}
                                height={160}
                                className="h-32 w-32 shrink-0 rounded-2xl border border-border object-cover sm:h-40 sm:w-40"
                            />
                        ) : null}
                        <div>
                            <p className="text-xs font-medium tracking-[0.25em] text-muted-foreground uppercase">
                                Atelier
                            </p>
                            <h1 className="mt-2 text-4xl font-bold tracking-tight text-balance text-foreground">
                                {name}
                            </h1>
                            {profile.city ? (
                                <p className="mt-2 flex items-center gap-1 text-base text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {profile.city}
                                    {profile.region ? `, ${profile.region}` : ''}
                                </p>
                            ) : null}
                            <div className="mt-4 flex flex-wrap gap-2">
                                {(profile.specialties ?? []).map((s) => (
                                    <Badge key={s} variant="outline">
                                        {s}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {profile.photos.length > 1 ? (
                    <div className="mx-auto mt-8 max-w-5xl px-6">
                        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {profile.photos.slice(1).map((photo) => (
                                <li
                                    key={photo.id}
                                    className="relative aspect-square overflow-hidden rounded-xl bg-muted"
                                >
                                    <Image src={photo.url} alt={name} fill sizes="25vw" className="object-cover" />
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}

                <div className="mx-auto mt-10 grid max-w-5xl gap-6 px-6 lg:grid-cols-2">
                    {profile.story ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Histoire</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm leading-relaxed text-foreground/90">
                                {profile.story}
                            </CardContent>
                        </Card>
                    ) : null}
                    {profile.method ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Méthode</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm leading-relaxed text-foreground/90">
                                {profile.method}
                            </CardContent>
                        </Card>
                    ) : null}
                    {profile.journey ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Parcours</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm leading-relaxed text-foreground/90">
                                {profile.journey}
                            </CardContent>
                        </Card>
                    ) : null}
                    {(profile.websiteUrl || (profile.links && Object.keys(profile.links).length > 0)) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Liens</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                {profile.websiteUrl ? (
                                    <a
                                        href={profile.websiteUrl}
                                        className="flex items-center gap-1.5 text-lumiris-emerald hover:underline"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Site externe <ExternalLink className="h-3 w-3" />
                                    </a>
                                ) : null}
                                {Object.entries(profile.links ?? {}).map(([label, url]) => (
                                    <a
                                        key={label}
                                        href={url}
                                        className="flex items-center gap-1.5 text-lumiris-emerald hover:underline"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {label} <ExternalLink className="h-3 w-3" />
                                    </a>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {!profile.story && !profile.method && !profile.journey && profile.photos.length === 0 ? (
                    <div className="mx-auto mt-10 max-w-5xl px-6">
                        <Card>
                            <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
                                <Award className="h-6 w-6 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    Votre vitrine est encore vide — ajoutez une histoire, une méthode ou des photos dans
                                    l&apos;éditeur.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                ) : null}
            </article>
        </div>
    );
}
