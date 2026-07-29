'use client';

import * as React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

import { cn } from '../../lib/cn';
import { Badge } from './badge';
import { Button } from './button';
import { Input } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './sheet';

interface DataTableFilterOption {
    label: string;
    value: string;
}

interface DataTableFilterSpec {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: readonly DataTableFilterOption[];
    placeholder?: string;
}

interface DataTableAdvancedFiltersSpec {
    title?: string;
    description?: string;
    triggerLabel?: string;
    activeCount?: number;
    children: React.ReactNode;
}

interface DataTableFiltersProps {
    search?: {
        value: string;
        onChange: (value: string) => void;
        placeholder?: string;
    };
    filters?: readonly DataTableFilterSpec[];
    advanced?: DataTableAdvancedFiltersSpec;
    onReset?: () => void;
    rightSlot?: React.ReactNode;
    className?: string;
}

function DataTableFilters({ search, filters, advanced, onReset, rightSlot, className }: DataTableFiltersProps) {
    const hasActiveFilter =
        Boolean(search?.value) ||
        Boolean(filters?.some((f) => f.value && f.value !== 'all')) ||
        (advanced?.activeCount ?? 0) > 0;

    return (
        <div data-slot="data-table-filters" className={cn('flex flex-wrap items-center gap-2', className)}>
            {search ? (
                <div className="relative w-full md:w-[280px]">
                    <Search
                        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden
                    />
                    <Input
                        value={search.value}
                        onChange={(event) => search.onChange(event.target.value)}
                        placeholder={search.placeholder ?? 'Rechercher…'}
                        className="h-8 pl-8 text-sm"
                    />
                </div>
            ) : null}
            {filters?.map((filter) => (
                <Select key={filter.label} value={filter.value} onValueChange={filter.onChange}>
                    <SelectTrigger size="sm" className="w-fit min-w-[140px]">
                        <SelectValue placeholder={filter.placeholder ?? filter.label} />
                    </SelectTrigger>
                    <SelectContent>
                        {filter.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ))}
            {advanced ? (
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5">
                            <SlidersHorizontal className="size-3.5" aria-hidden />
                            {advanced.triggerLabel ?? 'Filtres avancés'}
                            {advanced.activeCount && advanced.activeCount > 0 ? (
                                <Badge variant="secondary" className="ml-1 h-4 px-1.5 font-mono text-[10px]">
                                    {advanced.activeCount}
                                </Badge>
                            ) : null}
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:max-w-md">
                        <SheetHeader className="border-b border-border">
                            <SheetTitle>{advanced.title ?? 'Filtres avancés'}</SheetTitle>
                            {advanced.description ? <SheetDescription>{advanced.description}</SheetDescription> : null}
                        </SheetHeader>
                        <div className="flex flex-col gap-4 px-4 pb-4">{advanced.children}</div>
                    </SheetContent>
                </Sheet>
            ) : null}
            {onReset && hasActiveFilter ? (
                <Button variant="ghost" size="sm" onClick={onReset} className="gap-1 text-muted-foreground">
                    <X className="size-3.5" aria-hidden />
                    Réinitialiser
                </Button>
            ) : null}
            {rightSlot ? <div className="ml-auto flex items-center gap-2">{rightSlot}</div> : null}
        </div>
    );
}

export { DataTableFilters };
export type { DataTableFiltersProps, DataTableFilterSpec, DataTableFilterOption, DataTableAdvancedFiltersSpec };
