'use client';

import { type JournalCategory, JOURNAL_CATEGORY_LABEL } from '@lumiris/types';
import { cn } from '@lumiris/ui/lib/cn';

export type CategoryFilter = 'all' | JournalCategory;

interface CategoryChipsProps {
    categories: readonly JournalCategory[];
    value: CategoryFilter;
    onChange: (next: CategoryFilter) => void;
    compact?: boolean;
    sticky?: boolean;
}

interface ChipDef {
    key: CategoryFilter;
    label: string;
}

export function CategoryChips({ categories, value, onChange, compact = false, sticky = false }: CategoryChipsProps) {
    const chips: ChipDef[] = [
        { key: 'all', label: 'Tous' },
        ...categories.map((cat) => ({ key: cat as CategoryFilter, label: JOURNAL_CATEGORY_LABEL[cat] })),
    ];

    return (
        <div
            className={cn(
                'bg-background/85 -mx-4 border-b border-transparent backdrop-blur-md transition-[padding,border-color]',
                sticky && 'sticky top-0 z-20',
                compact ? 'border-border/40 px-4 py-2' : 'px-4 py-3',
            )}
        >
            <div
                role="tablist"
                aria-label="Filtrer par catégorie"
                className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {chips.map((chip) => {
                    const active = chip.key === value;
                    return (
                        <button
                            key={chip.key}
                            role="tab"
                            aria-selected={active}
                            type="button"
                            onClick={() => onChange(chip.key)}
                            className={cn(
                                'inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                                'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                                active
                                    ? 'bg-foreground text-background border-transparent shadow-sm'
                                    : 'bg-card/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-card/70',
                            )}
                        >
                            {chip.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
