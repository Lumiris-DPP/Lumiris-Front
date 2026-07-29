'use client';

import type { HTMLAttributes } from 'react';
import { Award, MapPin } from 'lucide-react';
import type { Artisan } from '@lumiris/types';
import { Badge } from '@lumiris/ui/components/badge';
import { cn } from '@lumiris/ui/lib/cn';

export interface ArtisanCardProps extends HTMLAttributes<HTMLDivElement> {
    artisan: Artisan;
    truncateStory?: boolean;
}

export function ArtisanCard({ artisan, truncateStory = false, className, ...rest }: ArtisanCardProps) {
    const story =
        truncateStory && artisan.story.length > 240 ? `${artisan.story.slice(0, 240).trimEnd()}…` : artisan.story;
    return (
        <article className={cn('flex gap-4 rounded-2xl border border-border/60 bg-card p-4', className)} {...rest}>
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted">
                {artisan.photoUrl ? (
                    <img src={artisan.photoUrl} alt={artisan.displayName} className="h-full w-full object-cover" />
                ) : null}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{artisan.displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{artisan.atelierName}</p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {artisan.city} · {artisan.region}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                    {artisan.epvLabeled ? (
                        <Badge
                            variant="outline"
                            className="gap-1 border-lumiris-emerald/30 bg-lumiris-emerald/10 text-[10px] text-lumiris-emerald"
                        >
                            <Award className="h-3 w-3" /> EPV
                        </Badge>
                    ) : null}
                    {artisan.ofgLabeled ? (
                        <Badge
                            variant="outline"
                            className="gap-1 border-lumiris-cyan/30 bg-lumiris-cyan/10 text-[10px] text-lumiris-cyan"
                        >
                            <Award className="h-3 w-3" /> OFG
                        </Badge>
                    ) : null}
                    {artisan.specialities.slice(0, 3).map((s) => (
                        <Badge key={s} variant="secondary" className="text-[10px]">
                            {s}
                        </Badge>
                    ))}
                </div>
                {story ? <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{story}</p> : null}
            </div>
        </article>
    );
}
