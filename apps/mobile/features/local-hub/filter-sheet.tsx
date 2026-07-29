'use client';

import { Check, SlidersHorizontal } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@lumiris/ui/components/sheet';
import { Slider } from '@lumiris/ui/components/slider';
import { cn } from '@lumiris/ui/lib/cn';

export const DISTANCE_MAX_KM = 100;

export interface LocalFilters {
    specialties: readonly string[];
    maxDistanceKm: number;
}

export const EMPTY_FILTERS: LocalFilters = { specialties: [], maxDistanceKm: DISTANCE_MAX_KM };

export function activeFilterCount(filters: LocalFilters): number {
    return filters.specialties.length + (filters.maxDistanceKm < DISTANCE_MAX_KM ? 1 : 0);
}

interface FilterSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    specialtyOptions: readonly string[];
    filters: LocalFilters;
    onChange: (next: LocalFilters) => void;
    resultCount: number;
    distanceEnabled: boolean;
}

export function FilterSheet({
    open,
    onOpenChange,
    specialtyOptions,
    filters,
    onChange,
    resultCount,
    distanceEnabled,
}: FilterSheetProps) {
    function toggleSpecialty(specialty: string) {
        const selected = filters.specialties.includes(specialty);
        onChange({
            ...filters,
            specialties: selected
                ? filters.specialties.filter((s) => s !== specialty)
                : [...filters.specialties, specialty],
        });
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="mx-auto max-h-[85vh] max-w-md overflow-y-auto rounded-t-3xl px-6 pt-6 pb-[max(env(safe-area-inset-bottom),1.5rem)]"
            >
                <SheetHeader className="px-0 text-left">
                    <SheetTitle className="flex items-center gap-2 text-base">
                        <SlidersHorizontal className="h-4 w-4 text-primary" strokeWidth={1.5} aria-hidden />
                        Filtres
                    </SheetTitle>
                    <SheetDescription className="text-xs">Affine par spécialité et distance.</SheetDescription>
                </SheetHeader>

                <div className="mt-5 flex flex-col gap-6">
                    {specialtyOptions.length > 0 ? (
                        <fieldset className="flex flex-col gap-3">
                            <legend className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                Spécialité
                            </legend>
                            <ul className="flex flex-wrap gap-2">
                                {specialtyOptions.map((specialty) => {
                                    const active = filters.specialties.includes(specialty);
                                    return (
                                        <li key={specialty}>
                                            <button
                                                type="button"
                                                aria-pressed={active}
                                                onClick={() => toggleSpecialty(specialty)}
                                                className={cn(
                                                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                                                    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none',
                                                    active
                                                        ? 'border-primary bg-primary/10 text-primary'
                                                        : 'border-border/60 bg-card text-muted-foreground hover:text-foreground',
                                                )}
                                            >
                                                {active ? (
                                                    <Check className="h-3 w-3" strokeWidth={2} aria-hidden />
                                                ) : null}
                                                {specialty}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </fieldset>
                    ) : null}

                    <fieldset className="flex flex-col gap-3">
                        <legend className="flex w-full items-center justify-between text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                            <span>Distance maximale</span>
                            <span className="font-mono text-foreground tabular-nums">
                                {filters.maxDistanceKm >= DISTANCE_MAX_KM ? 'Toutes' : `${filters.maxDistanceKm} km`}
                            </span>
                        </legend>
                        <Slider
                            min={5}
                            max={DISTANCE_MAX_KM}
                            step={5}
                            value={[filters.maxDistanceKm]}
                            onValueChange={([value]) =>
                                onChange({ ...filters, maxDistanceKm: value ?? DISTANCE_MAX_KM })
                            }
                            disabled={!distanceEnabled}
                            aria-label="Distance maximale en kilomètres"
                        />
                        {!distanceEnabled ? (
                            <p className="text-[11px] text-muted-foreground/80">
                                Partage ta position (vue Carte) pour filtrer par distance.
                            </p>
                        ) : null}
                    </fieldset>
                </div>

                <div className="mt-7 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => onChange(EMPTY_FILTERS)}
                        className="inline-flex h-12 items-center justify-center px-4 text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                        Réinitialiser
                    </button>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background active:scale-[0.98]"
                    >
                        Voir {resultCount} résultat{resultCount > 1 ? 's' : ''}
                    </button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
