'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@lumiris/ui/components/sheet';
import { Checkbox } from '@lumiris/ui/components/checkbox';
import { RadioGroup, RadioGroupItem } from '@lumiris/ui/components/radio-group';
import { cn } from '@lumiris/ui/lib/cn';
import type { GarmentKind } from '@lumiris/types';
import { KIND_LABEL_FR } from '@lumiris/utils';
import { SECTOR_LABEL_FR, type WardrobeSector } from '@/lib/wardrobe-storage';
import { SectionLabel } from '@/lib/section';

export type VaultSort = 'recent' | 'oldest' | 'grade-desc' | 'price-asc' | 'price-desc';

export interface VaultFilters {
    sectors: readonly WardrobeSector[];
    kinds: readonly GarmentKind[];
    brands: readonly string[];
    sort: VaultSort;
}

export const VAULT_DEFAULT_FILTERS: VaultFilters = { sectors: [], kinds: [], brands: [], sort: 'recent' };

const SORT_OPTIONS: ReadonlyArray<{ value: VaultSort; label: string }> = [
    { value: 'recent', label: 'Récents' },
    { value: 'oldest', label: 'Anciens' },
    { value: 'grade-desc', label: 'Grade ↓' },
    { value: 'price-asc', label: 'Prix ↑' },
    { value: 'price-desc', label: 'Prix ↓' },
];

interface FiltersSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    availableSectors: readonly WardrobeSector[];
    availableKinds: readonly GarmentKind[];
    availableBrands: readonly string[];
    value: VaultFilters;
    onApply: (filters: VaultFilters) => void;
}

export function FiltersSheet({
    open,
    onOpenChange,
    availableSectors,
    availableKinds,
    availableBrands,
    value,
    onApply,
}: FiltersSheetProps) {
    const [draft, setDraft] = useState<VaultFilters>(value);

    useEffect(() => {
        if (open) setDraft(value);
    }, [open, value]);

    const sortedSectors = useMemo(
        () => [...availableSectors].sort((a, b) => SECTOR_LABEL_FR[a].localeCompare(SECTOR_LABEL_FR[b])),
        [availableSectors],
    );
    const sortedKinds = useMemo(
        () => [...availableKinds].sort((a, b) => KIND_LABEL_FR[a].localeCompare(KIND_LABEL_FR[b])),
        [availableKinds],
    );
    const sortedBrands = useMemo(() => [...availableBrands].sort((a, b) => a.localeCompare(b)), [availableBrands]);

    const toggleSector = (sector: WardrobeSector) => {
        setDraft((prev) => ({
            ...prev,
            sectors: prev.sectors.includes(sector)
                ? prev.sectors.filter((s) => s !== sector)
                : [...prev.sectors, sector],
        }));
    };

    const toggleKind = (kind: GarmentKind) => {
        setDraft((prev) => ({
            ...prev,
            kinds: prev.kinds.includes(kind) ? prev.kinds.filter((k) => k !== kind) : [...prev.kinds, kind],
        }));
    };

    const toggleBrand = (brand: string) => {
        setDraft((prev) => ({
            ...prev,
            brands: prev.brands.includes(brand) ? prev.brands.filter((b) => b !== brand) : [...prev.brands, brand],
        }));
    };

    const reset = () => setDraft(VAULT_DEFAULT_FILTERS);

    const apply = () => {
        onApply(draft);
        onOpenChange(false);
    };

    const textileScope = sortedSectors.includes('textile');
    const sectorFilteredOutTextile = draft.sectors.length > 0 && !draft.sectors.includes('textile');
    const showKindsSection = textileScope && sortedKinds.length > 0 && !sectorFilteredOutTextile;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="mx-auto max-h-[85vh] max-w-md overflow-y-auto rounded-t-2xl pb-8">
                <SheetHeader className="pt-5 pb-3">
                    <SheetTitle className="text-base text-foreground">Filtres &amp; tri</SheetTitle>
                    <SheetDescription>Affine ton inventaire.</SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-6 px-4">
                    {sortedSectors.length > 1 ? (
                        <Section title="Secteur">
                            <div className="flex flex-wrap gap-2">
                                {sortedSectors.map((sector) => {
                                    const active = draft.sectors.includes(sector);
                                    return (
                                        <button
                                            key={sector}
                                            type="button"
                                            onClick={() => toggleSector(sector)}
                                            aria-pressed={active}
                                            className={cn(
                                                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                                                active
                                                    ? 'border-lumiris-cyan bg-lumiris-cyan/10 text-lumiris-cyan'
                                                    : 'border-border bg-card text-foreground/80',
                                            )}
                                        >
                                            {SECTOR_LABEL_FR[sector]}
                                        </button>
                                    );
                                })}
                            </div>
                        </Section>
                    ) : null}

                    {showKindsSection ? (
                        <Section title="Catégorie textile">
                            <ul className="grid grid-cols-2 gap-2">
                                {sortedKinds.map((kind) => {
                                    const checked = draft.kinds.includes(kind);
                                    return (
                                        <li key={kind}>
                                            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-sm hover:bg-muted/30">
                                                <Checkbox
                                                    checked={checked}
                                                    onCheckedChange={() => toggleKind(kind)}
                                                    aria-label={KIND_LABEL_FR[kind]}
                                                />
                                                <span className="text-foreground">{KIND_LABEL_FR[kind]}</span>
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>
                        </Section>
                    ) : null}

                    {sortedBrands.length > 0 ? (
                        <Section title="Marque">
                            <div className="flex flex-wrap gap-2">
                                {sortedBrands.map((brand) => {
                                    const active = draft.brands.includes(brand);
                                    return (
                                        <button
                                            key={brand}
                                            type="button"
                                            onClick={() => toggleBrand(brand)}
                                            aria-pressed={active}
                                            className={cn(
                                                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                                                active
                                                    ? 'border-lumiris-cyan bg-lumiris-cyan/10 text-lumiris-cyan'
                                                    : 'border-border bg-card text-foreground/80',
                                            )}
                                        >
                                            {brand}
                                        </button>
                                    );
                                })}
                            </div>
                        </Section>
                    ) : null}

                    <Section title="Tri">
                        <RadioGroup
                            value={draft.sort}
                            onValueChange={(v) => setDraft((prev) => ({ ...prev, sort: v as VaultSort }))}
                            className="grid gap-2"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <label
                                    key={opt.value}
                                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-sm hover:bg-muted/30"
                                >
                                    <RadioGroupItem value={opt.value} />
                                    <span className="text-foreground">{opt.label}</span>
                                </label>
                            ))}
                        </RadioGroup>
                    </Section>

                    <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-4">
                        <button
                            type="button"
                            onClick={reset}
                            className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground"
                        >
                            Réinitialiser
                        </button>
                        <button
                            type="button"
                            onClick={apply}
                            className="inline-flex flex-1 items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-primary-foreground active:scale-95"
                        >
                            Appliquer
                        </button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-3">
            <SectionLabel title={title} />
            {children}
        </section>
    );
}
