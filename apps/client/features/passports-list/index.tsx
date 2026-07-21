'use client';

import { useMemo, useState } from 'react';
import { QrCode } from 'lucide-react';
import type { DppStatus } from '@lumiris/api-client';
import { useDppForms } from '@lumiris/api-client/react';
import { Button } from '@lumiris/ui/components/button';
import { Input } from '@lumiris/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { useAuthStore } from '@/lib/auth-store';
import { EmptyState } from '@/features/empty-state';
import { CreatePassportCta } from '@/features/quota-upsell/create-passport-cta';
import { DppTable } from './dpp-table';

type StatusFilter = DppStatus | 'all';

export function PassportsList() {
    const token = useAuthStore((s) => s.token);
    const { data: dppForms = [], isLoading: loading, error } = useDppForms({ enabled: Boolean(token) });
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return dppForms.filter((dpp) => {
            if (statusFilter !== 'all' && dpp.status !== statusFilter) return false;
            if (!term) return true;
            return (dpp.productName ?? '').toLowerCase().includes(term) || (dpp.sku ?? '').toLowerCase().includes(term);
        });
    }, [dppForms, search, statusFilter]);

    if (loading) {
        return <div className="text-muted-foreground p-8 text-sm">Chargement…</div>;
    }

    if (error) {
        return <div className="text-destructive p-8 text-sm">Erreur : {error.message}</div>;
    }

    if (dppForms.length === 0) {
        return (
            <div className="space-y-6 p-8">
                <EmptyState
                    icon={QrCode}
                    title="Vous n'avez pas encore de passeport"
                    description="Créez votre premier passeport numérique produit pour documenter une pièce textile et générer son QR."
                >
                    <CreatePassportCta className="bg-lumiris-cyan hover:bg-lumiris-cyan/90 text-white">
                        Créer mon premier passeport
                    </CreatePassportCta>
                </EmptyState>
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
                        <SelectItem value="DRAFT">Brouillon</SelectItem>
                        <SelectItem value="VALID">Publié</SelectItem>
                        <SelectItem value="INVALID">Invalide</SelectItem>
                    </SelectContent>
                </Select>
                {(search || statusFilter !== 'all') && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSearch('');
                            setStatusFilter('all');
                        }}
                    >
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
