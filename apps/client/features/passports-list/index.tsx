'use client';

import { useMemo, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import type { DppStatus } from '@/lib/dpp-api';
import { useDppForms } from '@/lib/use-dpp-forms';
import { Button } from '@lumiris/ui/components/button';
import { Input } from '@lumiris/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { DppTable } from './dpp-table';
import { EmptyState } from './empty-state';

type StatusFilter = DppStatus | 'all';

export function PassportsList() {
    const { dppForms, loading, error } = useDppForms();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return dppForms.filter((dpp) => {
            if (statusFilter !== 'all' && dpp.status !== statusFilter) return false;
            if (!term) return true;
            return (dpp.productName ?? '').toLowerCase().includes(term) ||
                   (dpp.sku ?? '').toLowerCase().includes(term);
        });
    }, [dppForms, search, statusFilter]);

    if (loading) {
        return (
            <div className="text-muted-foreground p-8 text-sm">Chargement…</div>
        );
    }

    if (error) {
        return (
            <div className="text-destructive p-8 text-sm">Erreur : {error}</div>
        );
    }

    if (dppForms.length === 0) {
        return (
            <div className="space-y-6 p-8">
                <EmptyState />
            </div>
        );
    }

    return (
        <div className="space-y-4 p-8">
            <div className="flex items-center gap-3">
                <Input
                    placeholder="Rechercher par nom ou SKU"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-xs"
                />
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                    <SelectTrigger className="w-36">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="VALID">Valide</SelectItem>
                        <SelectItem value="INVALID">Invalide</SelectItem>
                    </SelectContent>
                </Select>
                {(search || statusFilter !== 'all') && (
                    <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); }}>
                        Réinitialiser
                    </Button>
                )}
            </div>

            <DppTable rows={filtered} />

            <p className="text-muted-foreground text-xs">
                {filtered.length} DPP{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}
                {dppForms.length !== filtered.length && ` sur ${dppForms.length}`}
            </p>
        </div>
    );
}
