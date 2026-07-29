'use client';

import { Info } from 'lucide-react';
import type { IrisMethodologySection } from '@lumiris/api-client';
import { useIrisMethodology } from '@lumiris/api-client/react';
import type { IrisAxis } from '@lumiris/types';
import { Popover, PopoverContent, PopoverTrigger } from '@lumiris/ui/components/popover';
import { Skeleton } from '@lumiris/ui/components/skeleton';
import { cn } from '@lumiris/ui/lib/cn';
import { AXIS_COLOR } from '../theme/grade-color';

export interface IrisMethodologyInfoProps {
    className?: string;
    /** Côté d'ouverture de la popover ; `left` convient aux colonnes latérales. */
    side?: 'top' | 'right' | 'bottom' | 'left';
}

const AXIS_KEYS = new Set<string>(['transparency', 'craftsmanship', 'impact', 'repairability']);

function sectionDotClass(key: string): string {
    return AXIS_KEYS.has(key) ? `bg-${AXIS_COLOR[key as IrisAxis]}` : 'bg-muted-foreground/40';
}

/**
 * Bouton « i » ouvrant l'explication complète du calcul du score Iris.
 * Le contenu vient de l'API publique et est mis en cache par TanStack Query,
 * la requête ne partant qu'à la première ouverture de la popover.
 */
export function IrisMethodologyInfo({ className, side = 'left' }: IrisMethodologyInfoProps) {
    const { data, isLoading, isError } = useIrisMethodology();

    return (
        <Popover>
            <PopoverTrigger
                className={cn(
                    'inline-flex size-5 shrink-0 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                    className,
                )}
                aria-label="Comment est calculé le score Iris ?"
            >
                <Info className="size-3" aria-hidden />
            </PopoverTrigger>
            <PopoverContent side={side} align="start" className="max-h-[70vh] w-[22rem] overflow-y-auto p-0">
                {isLoading && <MethodologySkeleton />}

                {isError && (
                    <p className="p-4 text-xs text-muted-foreground">
                        La méthodologie n&apos;a pas pu être chargée. Réessayez dans un instant.
                    </p>
                )}

                {data && (
                    <div className="space-y-4 p-4">
                        <header className="space-y-1.5">
                            <h2 className="text-sm font-semibold text-foreground">{data.title}</h2>
                            <p className="text-xs leading-relaxed text-muted-foreground">{data.intro}</p>
                        </header>

                        <div className="space-y-4 border-t pt-3">
                            {data.sections.map((section) => (
                                <SectionBlock key={section.key} section={section} />
                            ))}
                        </div>

                        <section className="space-y-1.5 border-t pt-3">
                            <h3 className="text-xs font-semibold text-foreground">Barème des lettres</h3>
                            <ul className="space-y-1">
                                {data.grades.map((grade) => (
                                    <li
                                        key={grade.grade}
                                        className="flex gap-2 text-[11px] leading-relaxed text-muted-foreground"
                                    >
                                        <span className="w-14 shrink-0 font-mono font-semibold text-foreground">
                                            {grade.grade} ≥ {grade.minScore}
                                        </span>
                                        <span>{grade.label}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {data.disclaimer && (
                            <p className="border-t pt-3 text-[11px] leading-relaxed text-muted-foreground/80">
                                {data.disclaimer}
                            </p>
                        )}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

function SectionBlock({ section }: { section: IrisMethodologySection }) {
    return (
        <section className="space-y-1.5">
            <div className="flex items-baseline gap-2">
                <span className={cn('mt-1 size-1.5 shrink-0 rounded-full', sectionDotClass(section.key))} aria-hidden />
                <h3 className="text-xs font-semibold text-foreground">{section.label}</h3>
                {section.weightPercent != null && (
                    <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground">
                        {section.weightPercent} %
                    </span>
                )}
            </div>
            <p className="pl-3.5 text-[11px] leading-relaxed text-muted-foreground">{section.summary}</p>
            <ul className="space-y-1.5 pl-3.5">
                {section.criteria.map((criterion) => (
                    <li key={criterion.label} className="text-[11px] leading-relaxed">
                        <span className="font-medium text-foreground">
                            {criterion.label}
                            {criterion.points != null && (
                                <span className="font-mono font-normal text-muted-foreground">
                                    {' '}
                                    · {criterion.points} pts
                                </span>
                            )}
                        </span>
                        <p className="text-muted-foreground">{criterion.description}</p>
                    </li>
                ))}
            </ul>
        </section>
    );
}

function MethodologySkeleton() {
    return (
        <div className="space-y-3 p-4" aria-busy="true">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-16 w-full" />
        </div>
    );
}
