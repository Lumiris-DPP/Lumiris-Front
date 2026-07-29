'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { mockPassports } from '@lumiris/mock-data';
import type { Passport, ScoreResult } from '@lumiris/types';
import { gradeBackgroundSolid } from '@lumiris/scoring-ui';
import { Button } from '@lumiris/ui/components/button';
import { cn } from '@lumiris/ui/lib/cn';
import { scorePassport } from '@/lib/passport-score';

interface PreviewItem {
    passport: Passport;
    score: ScoreResult;
}

export function MarketplaceBanner() {
    const previews = useMemo<readonly PreviewItem[]>(() => {
        const now = new Date();
        return mockPassports
            .filter((p) => p.status === 'Published')
            .map((p) => ({ passport: p, score: scorePassport(p, now) }))
            .sort((a, b) => b.score.total - a.score.total)
            .slice(0, 3);
    }, []);

    return (
        <section
            aria-label="Marketplace LUMIRIS"
            className="rounded-2xl border border-lumiris-cyan/30 bg-lumiris-cyan/5 p-5"
        >
            <p className="text-[10px] font-semibold tracking-wider text-lumiris-cyan uppercase">Marketplace LUMIRIS</p>
            <p className="mt-1 text-sm font-semibold text-foreground">Trie exclusivement par score Iris</p>

            {previews.length > 0 ? (
                <ul className="mt-4 flex gap-2">
                    {previews.map(({ passport, score }) => (
                        <li key={passport.id} className="flex-1">
                            <Link
                                href={`/passeport/${passport.id}`}
                                aria-label={`${passport.garment.reference} - grade ${score.grade}`}
                                className={cn(
                                    'relative block aspect-square overflow-hidden rounded-xl border border-border/40 bg-card',
                                    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none',
                                )}
                            >
                                {passport.garment.mainPhotoUrl ? (
                                    <Image
                                        src={passport.garment.mainPhotoUrl}
                                        alt=""
                                        fill
                                        sizes="33vw"
                                        className="object-cover"
                                    />
                                ) : (
                                    <div
                                        aria-hidden
                                        className="absolute inset-0"
                                        style={{
                                            background: `linear-gradient(135deg, var(--iris-grade-${score.grade.toLowerCase()}), var(--lumiris-cyan))`,
                                        }}
                                    />
                                )}
                                <span
                                    aria-hidden
                                    className={cn(
                                        'absolute top-1.5 right-1.5 inline-flex h-6 w-6 items-center justify-center rounded-md font-mono text-[11px] font-bold text-primary-foreground shadow-sm',
                                        gradeBackgroundSolid(score.grade),
                                    )}
                                >
                                    {score.grade}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : null}

            <Button asChild className="mt-4 w-full rounded-full">
                <Link href="/boutique" aria-label="Parcourir tout le catalogue marketplace">
                    <span>Parcourir tout le catalogue</span>
                    <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
            </Button>
        </section>
    );
}
