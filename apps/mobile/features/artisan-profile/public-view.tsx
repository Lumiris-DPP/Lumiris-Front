import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ArtisanPublicProfileDto } from '@/lib/public-artisan-api';

export function ArtisanPublicProfile({ artisan }: { artisan: ArtisanPublicProfileDto }) {
    const navigate = useNavigate();
    const title = artisan.atelierName ?? artisan.displayName ?? 'Atelier';

    return (
        <div className="bg-background flex h-full flex-col overflow-y-auto pb-24">
            <motion.header
                className="flex items-center gap-3 px-4 pb-3 pt-12"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    aria-label="Retour"
                    className="border-border bg-card text-foreground inline-flex h-9 w-9 items-center justify-center rounded-full border"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                    <h1 className="text-foreground truncate text-base font-bold">{title}</h1>
                    {artisan.city ? (
                        <p className="text-muted-foreground flex items-center gap-1 truncate text-xs">
                            <MapPin className="h-3 w-3" />
                            {artisan.city}
                            {artisan.region ? ` · ${artisan.region}` : ''}
                        </p>
                    ) : null}
                </div>
            </motion.header>

            <div className="flex flex-col gap-5 px-4">
                {artisan.photoUrls.length > 0 ? (
                    <div className="flex gap-2 overflow-x-auto">
                        {artisan.photoUrls.map((url) => (
                            <div key={url} className="relative h-40 w-40 shrink-0 overflow-hidden rounded-xl">
                                <img src={url} alt={title} className="absolute inset-0 h-full w-full object-cover" />
                            </div>
                        ))}
                    </div>
                ) : null}

                {artisan.specialties && artisan.specialties.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                        {artisan.specialties.map((s) => (
                            <span
                                key={s}
                                className="bg-lumiris-emerald/10 text-lumiris-emerald rounded-md px-2 py-1 text-xs"
                            >
                                {s}
                            </span>
                        ))}
                    </div>
                ) : null}

                {artisan.story ? (
                    <section>
                        <h2 className="text-foreground mb-1 text-sm font-semibold">Histoire</h2>
                        <p className="text-foreground/90 text-sm leading-relaxed">{artisan.story}</p>
                    </section>
                ) : null}

                {artisan.method ? (
                    <section>
                        <h2 className="text-foreground mb-1 text-sm font-semibold">Méthode</h2>
                        <p className="text-foreground/90 text-sm leading-relaxed">{artisan.method}</p>
                    </section>
                ) : null}

                {artisan.journey ? (
                    <section>
                        <h2 className="text-foreground mb-1 text-sm font-semibold">Parcours</h2>
                        <p className="text-foreground/90 text-sm leading-relaxed">{artisan.journey}</p>
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
                                className="text-lumiris-emerald inline-flex items-center gap-1.5 text-sm hover:underline"
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
                        className="text-lumiris-emerald inline-flex items-center gap-1.5 text-sm hover:underline"
                    >
                        Site externe <ExternalLink className="h-3 w-3" />
                    </a>
                ) : null}
            </div>
        </div>
    );
}
