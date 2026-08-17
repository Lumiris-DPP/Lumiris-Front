'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Award, MapPin, Filter, X } from 'lucide-react';
import { Badge } from '@lumiris/ui/components/badge';
import type { ArtisanPublicProfileDto } from '@/lib/public-artisan-api';

const SPECIALITIES = ['Couture', 'Tissage', 'Bonneterie', 'Chausseur', 'Broderie'] as const;
type Speciality = (typeof SPECIALITIES)[number];

type CertificationFilter = 'all' | 'epv' | 'ofg';

const UNKNOWN_REGION = 'Région non renseignée';

function classifyArtisan(artisan: ArtisanPublicProfileDto): readonly Speciality[] {
    const specs = (artisan.specialties ?? []).map((s) => s.toLowerCase()).join(' | ');
    const matches: Speciality[] = [];
    if (/couture|sur mesure|haute façon|tailleur/.test(specs)) matches.push('Couture');
    if (/tiss|laine|filature/.test(specs)) matches.push('Tissage');
    if (/tricot|bonnet|maill/.test(specs)) matches.push('Bonneterie');
    if (/chauss|cordonn|cuir|tannage|maroqu/.test(specs)) matches.push('Chausseur');
    if (/brod/.test(specs)) matches.push('Broderie');
    return matches;
}

function atelierNameOf(artisan: ArtisanPublicProfileDto): string {
    return artisan.atelierName ?? artisan.displayName ?? 'Atelier';
}

interface Props {
    artisans: readonly ArtisanPublicProfileDto[];
}

export function ArtisansDirectory({ artisans }: Props) {
    const [region, setRegion] = useState<string>('all');
    const [specs, setSpecs] = useState<readonly Speciality[]>([]);
    const [cert, setCert] = useState<CertificationFilter>('all');

    const enriched = useMemo(
        () =>
            artisans.map((artisan) => ({
                artisan,
                families: classifyArtisan(artisan),
                region: artisan.region ?? UNKNOWN_REGION,
            })),
        [artisans],
    );

    const allRegions = useMemo(
        () => Array.from(new Set(enriched.map((e) => e.region))).sort((a, b) => a.localeCompare(b)),
        [enriched],
    );

    const filtered = useMemo(
        () =>
            enriched.filter(({ artisan, families, region: entryRegion }) => {
                if (region !== 'all' && entryRegion !== region) return false;
                if (specs.length > 0 && !specs.some((s) => families.includes(s))) return false;
                if (cert === 'epv' && !artisan.epvLabeled) return false;
                if (cert === 'ofg' && !artisan.ofgLabeled) return false;
                return true;
            }),
        [enriched, region, specs, cert],
    );

    const grouped = useMemo(() => {
        const map = new Map<string, typeof filtered>();
        for (const entry of filtered) {
            const list = map.get(entry.region) ?? [];
            list.push(entry);
            map.set(entry.region, list);
        }
        return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
    }, [filtered]);

    const toggleSpec = (s: Speciality) => {
        setSpecs((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
    };

    const reset = () => {
        setRegion('all');
        setSpecs([]);
        setCert('all');
    };

    const hasFilters = region !== 'all' || specs.length > 0 || cert !== 'all';

    return (
        <div>
            {artisans.length === 0 ? (
                <section className="mx-auto max-w-5xl px-6">
                    <p className="rounded-2xl border border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
                        Aucun atelier n&apos;a encore publié sa vitrine. Revenez bientôt.
                    </p>
                </section>
            ) : (
                <>
                    <section
                        aria-label="Filtres de l’annuaire"
                        className="mx-auto mb-10 max-w-5xl rounded-2xl border border-border bg-card p-5"
                    >
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                                <Filter className="h-3.5 w-3.5" />
                                Filtres
                            </span>

                            <select
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground"
                                aria-label="Région"
                            >
                                <option value="all">Toutes régions</option>
                                {allRegions.map((r) => (
                                    <option key={r} value={r}>
                                        {r}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={cert}
                                onChange={(e) => setCert(e.target.value as CertificationFilter)}
                                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground"
                                aria-label="Certification"
                            >
                                <option value="all">Toutes certifications</option>
                                <option value="epv">Entreprise du Patrimoine Vivant</option>
                                <option value="ofg">Origine France Garantie</option>
                            </select>

                            {hasFilters ? (
                                <button
                                    type="button"
                                    onClick={reset}
                                    className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                                >
                                    <X className="h-3 w-3" />
                                    Réinitialiser
                                </button>
                            ) : null}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {SPECIALITIES.map((s) => {
                                const active = specs.includes(s);
                                return (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => toggleSpec(s)}
                                        aria-pressed={active}
                                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                                            active
                                                ? 'border-foreground bg-foreground text-background'
                                                : 'border-border text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <section className="mx-auto max-w-5xl px-6">
                        {filtered.length === 0 ? (
                            <p className="py-12 text-center text-sm text-muted-foreground">
                                Aucun atelier ne correspond à ces filtres.{' '}
                                <button
                                    type="button"
                                    onClick={reset}
                                    className="text-foreground underline-offset-4 hover:underline"
                                >
                                    Réinitialiser
                                </button>
                                .
                            </p>
                        ) : (
                            grouped.map(([regionName, entries]) => (
                                <div key={regionName} className="mb-12 last:mb-0">
                                    <h2 className="mb-4 text-xs font-medium tracking-[0.25em] text-muted-foreground uppercase">
                                        {regionName} · {entries.length}
                                    </h2>
                                    <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                        {entries.map(({ artisan, families }, i) => (
                                            <motion.li
                                                key={artisan.slug}
                                                initial={{ opacity: 0, y: 16 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true, margin: '-30px' }}
                                                transition={{ duration: 0.4, delay: i * 0.04 }}
                                            >
                                                <Link
                                                    href={`/artisans/${artisan.slug}`}
                                                    className="hover:border-grade-a/40 group flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                                                >
                                                    <div className="flex gap-4">
                                                        {artisan.photoUrls[0] ? (
                                                            <Image
                                                                src={artisan.photoUrls[0]}
                                                                alt={`Atelier ${atelierNameOf(artisan)}`}
                                                                width={64}
                                                                height={64}
                                                                unoptimized
                                                                className="h-16 w-16 shrink-0 rounded-xl border border-border object-cover"
                                                            />
                                                        ) : (
                                                            <span
                                                                aria-hidden
                                                                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-lg font-semibold text-muted-foreground"
                                                            >
                                                                {atelierNameOf(artisan).charAt(0).toUpperCase()}
                                                            </span>
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <h3 className="group-hover:text-grade-a truncate text-base leading-snug font-semibold text-foreground transition-colors">
                                                                {atelierNameOf(artisan)}
                                                            </h3>
                                                            {artisan.displayName ? (
                                                                <p className="truncate text-xs text-muted-foreground">
                                                                    {artisan.displayName}
                                                                </p>
                                                            ) : null}
                                                            {artisan.city ? (
                                                                <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                                    <MapPin className="h-3 w-3" />
                                                                    {artisan.city}
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex flex-wrap gap-1.5">
                                                        {artisan.epvLabeled && (
                                                            <Badge variant="secondary" className="gap-1 text-[11px]">
                                                                <Award className="h-3 w-3" /> EPV
                                                            </Badge>
                                                        )}
                                                        {artisan.ofgLabeled && (
                                                            <Badge variant="secondary" className="text-[11px]">
                                                                OFG
                                                            </Badge>
                                                        )}
                                                        {artisan.gotsLabeled && (
                                                            <Badge variant="secondary" className="text-[11px]">
                                                                GOTS
                                                            </Badge>
                                                        )}
                                                        {artisan.oekoTexLabeled && (
                                                            <Badge variant="secondary" className="text-[11px]">
                                                                OEKO-TEX
                                                            </Badge>
                                                        )}
                                                        {families.map((f) => (
                                                            <span
                                                                key={f}
                                                                className="rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                                                            >
                                                                {f}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    {artisan.story ? (
                                                        <p className="mt-4 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                                                            {artisan.story}
                                                        </p>
                                                    ) : null}
                                                </Link>
                                            </motion.li>
                                        ))}
                                    </ul>
                                </div>
                            ))
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
