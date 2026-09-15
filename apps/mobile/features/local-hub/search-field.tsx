'use client';

import { Search, X } from 'lucide-react';

interface SearchFieldProps {
    value: string;
    onChange: (next: string) => void;
}

export function SearchField({ value, onChange }: SearchFieldProps) {
    return (
        <form role="search" onSubmit={(e) => e.preventDefault()} className="relative flex items-center">
            <Search
                className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground"
                strokeWidth={1.5}
                aria-hidden
            />
            <input
                type="search"
                inputMode="search"
                enterKeyHint="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Rechercher un artisan, un réparateur…"
                aria-label="Rechercher un artisan ou un réparateur par nom"
                className="h-10 w-full rounded-full border border-border bg-card pr-10 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            />
            {value.length > 0 ? (
                <button
                    type="button"
                    aria-label="Effacer la recherche"
                    onClick={() => onChange('')}
                    className="absolute right-3 text-muted-foreground hover:text-foreground"
                >
                    <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
            ) : null}
        </form>
    );
}
