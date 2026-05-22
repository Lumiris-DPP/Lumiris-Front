'use client';

import { memo, useMemo, useState } from 'react';
import { mockRepairers } from '@lumiris/mock-data';
import type { Repairer } from '@lumiris/types';
import { DataTableFilters } from '@lumiris/ui/components/data-table-filters';
import { RetoucheurDrawer } from './retoucheur-drawer';
import { RetoucheurTable } from './retoucheur-table';
import type { RetoucheurOverlay } from './types';

function RepairersComponent() {
    const [overlays, setOverlays] = useState<Map<string, RetoucheurOverlay>>(() => new Map());
    const [search, setSearch] = useState('');
    const [cityFilter, setCityFilter] = useState<string>('all');
    const [selected, setSelected] = useState<Repairer | null>(null);

    const cityOptions = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const r of mockRepairers) counts[r.city] = (counts[r.city] ?? 0) + 1;
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        return [
            { value: 'all', label: 'Toutes villes' },
            ...sorted.map(([city, n]) => ({ value: city, label: `${city} · ${n}` })),
        ];
    }, []);

    const filtered = useMemo(() => {
        return mockRepairers.filter((r) => {
            if (cityFilter !== 'all' && r.city !== cityFilter) return false;
            if (search.trim().length > 0) {
                const needle = search.toLowerCase();
                const haystack = `${r.displayName} ${r.atelierName ?? ''} ${r.city}`.toLowerCase();
                if (!haystack.includes(needle)) return false;
            }
            return true;
        });
    }, [search, cityFilter]);

    const resetFilters = () => {
        setSearch('');
        setCityFilter('all');
    };

    const patchOverlay = (id: string, patch: Partial<RetoucheurOverlay>) =>
        setOverlays((prev) => {
            const next = new Map(prev);
            next.set(id, { ...(next.get(id) ?? {}), ...patch });
            return next;
        });

    return (
        <div className="space-y-6">
            <DataTableFilters
                search={{ value: search, onChange: setSearch, placeholder: 'Nom, atelier, ville…' }}
                filters={[{ label: 'Ville', value: cityFilter, onChange: setCityFilter, options: cityOptions }]}
                onReset={resetFilters}
            />

            <RetoucheurTable
                rows={filtered}
                overlays={overlays}
                onSelect={setSelected}
                cityFilter={cityFilter}
                onResetFilters={resetFilters}
            />

            <RetoucheurDrawer
                retoucheur={selected}
                overlay={selected ? overlays.get(selected.id) : undefined}
                onClose={() => setSelected(null)}
                onPatchOverlay={patchOverlay}
            />
        </div>
    );
}

export const Repairers = memo(RepairersComponent);

export { Repairers as Retoucheurs };
