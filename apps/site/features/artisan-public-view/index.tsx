import Image from 'next/image';
import Link from 'next/link';
import { Award, CalendarClock, ExternalLink, MapPin } from 'lucide-react';
import { Badge } from '@lumiris/ui/components/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import { formatDateFr } from '@lumiris/utils';
import type { ArtisanPublicProfileDto } from '@/lib/public-artisan-api';

interface Props {
    artisan: ArtisanPublicProfileDto;
}

export function ArtisanPublicView({ artisan }: Props) {
    const name = artisan.atelierName ?? artisan.displayName ?? 'Atelier';

    return (
        <article className="pt-28 pb-20">
            <header className="mx-auto max-w-5xl px-6">
                <Link
                    href="/artisans"
                    className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
                >
                    ← Tous les artisans
                </Link>
                <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
                    {artisan.photoUrls[0] ? (
                        <Image
                            src={artisan.photoUrls[0]}
                            alt={`Portrait de ${name}`}
                            width={160}
                            height={160}
                            className="h-32 w-32 shrink-0 rounded-2xl border border-border object-cover sm:h-40 sm:w-40"
                            priority
                        />
                    ) : null}
                    <div>
                        <p className="text-xs font-medium tracking-[0.25em] text-muted-foreground uppercase">Atelier</p>
                        <h1 className="mt-2 text-4xl font-bold tracking-tight text-balance text-foreground">{name}</h1>
                        {artisan.displayName || artisan.city ? (
                            <p className="mt-2 text-base text-muted-foreground">
                                {artisan.displayName}
                                {artisan.displayName && artisan.city ? ' · ' : ''}
                                {artisan.city ? (
                                    <span className="inline-flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {artisan.city}
                                        {artisan.region ? `, ${artisan.region}` : ''}
                                    </span>
                                ) : null}
                            </p>
                        ) : null}
                        {artisan.pausedUntil ? (
                            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-lumiris-cyan/40 bg-lumiris-cyan/10 px-3 py-1 text-xs font-medium text-foreground">
                                <CalendarClock className="h-3.5 w-3.5 text-lumiris-cyan" aria-hidden />
                                Atelier en pause — de retour le {formatDateFr(artisan.pausedUntil)}
                            </p>
                        ) : null}
                        <div className="mt-4 flex flex-wrap gap-2">
                            {artisan.epvLabeled && (
                                <Badge variant="secondary" className="gap-1">
                                    <Award className="h-3 w-3" /> Entreprise du Patrimoine Vivant
                                </Badge>
                            )}
                            {artisan.ofgLabeled && <Badge variant="secondary">Origine France Garantie</Badge>}
                            {artisan.gotsLabeled && <Badge variant="secondary">GOTS</Badge>}
                            {artisan.oekoTexLabeled && <Badge variant="secondary">OEKO-TEX</Badge>}
                            {(artisan.specialties ?? []).map((s) => (
                                <Badge key={s} variant="outline">
                                    {s}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {artisan.photoUrls.length > 1 ? (
                <section className="mx-auto mt-8 max-w-5xl px-6">
                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {artisan.photoUrls.slice(1).map((url) => (
                            <li key={url} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                                <Image src={url} alt={name} fill sizes="25vw" className="object-cover" />
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}

            <section className="mx-auto mt-10 grid max-w-5xl gap-6 px-6 lg:grid-cols-2">
                {artisan.story ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Histoire</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm leading-relaxed text-foreground/90">
                            {artisan.story}
                        </CardContent>
                    </Card>
                ) : null}
                {artisan.method ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Méthode</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm leading-relaxed text-foreground/90">
                            {artisan.method}
                        </CardContent>
                    </Card>
                ) : null}
                {artisan.journey ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Parcours</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm leading-relaxed text-foreground/90">
                            {artisan.journey}
                        </CardContent>
                    </Card>
                ) : null}
                {(artisan.websiteUrl || (artisan.links && Object.keys(artisan.links).length > 0)) && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Liens</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            {artisan.websiteUrl ? (
                                <a
                                    href={artisan.websiteUrl}
                                    className="text-grade-a inline-flex items-center gap-1.5 hover:underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Site externe <ExternalLink className="h-3 w-3" />
                                </a>
                            ) : null}
                            {Object.entries(artisan.links ?? {}).map(([label, url]) => (
                                <a
                                    key={label}
                                    href={url}
                                    className="text-grade-a flex items-center gap-1.5 hover:underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {label} <ExternalLink className="h-3 w-3" />
                                </a>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </section>
        </article>
    );
}
