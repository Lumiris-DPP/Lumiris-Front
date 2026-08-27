'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, QrCode } from 'lucide-react';
import type { DppStatus } from '@lumiris/api-client';
import { useDppForms } from '@lumiris/api-client/react';
import { Card } from '@lumiris/ui/components/card';
import { DataTableFilters } from '@lumiris/ui/components/data-table-filters';
import { Skeleton } from '@lumiris/ui/components/skeleton';
import { useAuthStore } from '@/lib/auth-store';
import { EmptyState } from '@/features/empty-state';
import { CreatePassportCta } from '@/features/quota-upsell/create-passport-cta';
import { DppTable } from './dpp-table';
import { dppStatusLabel } from './dpp-visuals';

type StatusFilter = DppStatus | 'all';

const STATUS_ORDER: DppStatus[] = ['DRAFT', 'VALID', 'INVALID'];

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

    const statusOptions = useMemo(() => {
        const count = (status: DppStatus) => dppForms.filter((dpp) => dpp.status === status).length;
        return [
            { label: `Tous (${dppForms.length})`, value: 'all' },
            ...STATUS_ORDER.map((status) => ({
                label: `${dppStatusLabel(status)} (${count(status)})`,
                value: status,
            })),
        ];
    }, [dppForms]);

    const reset = () => {
        setSearch('');
        setStatusFilter('all');
    };

    if (loading) {
        return <PassportsListSkeleton />;
    }

    if (error) {
        return (
            <div className="p-4 md:p-8">
                <Card className="flex-row items-start gap-3 border-destructive/30 bg-destructive/5 p-4 text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
                    <div className="space-y-0.5">
                        <p className="font-medium text-destructive">Impossible de charger vos passeports</p>
                        <p className="text-muted-foreground">{error.message}</p>
                    </div>
                </Card>
            </div>
        );
    }

    if (dppForms.length === 0) {
        return (
            <div className="space-y-6 p-4 md:p-8">
                <EmptyState
                    icon={QrCode}
                    title="Vous n'avez pas encore de passeport"
                    description="Créez votre premier passeport numérique produit pour documenter une pièce textile et générer son QR."
                >
                    <CreatePassportCta className="bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90">
                        Créer mon premier passeport
                    </CreatePassportCta>
                </EmptyState>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4 md:p-8">
            <DataTableFilters
                search={{
                    value: search,
                    onChange: setSearch,
                    placeholder: 'Rechercher par nom ou SKU',
                }}
                filters={[
                    {
                        label: 'Statut',
                        value: statusFilter,
                        onChange: (v) => setStatusFilter(v as StatusFilter),
                        options: statusOptions,
                    },
                ]}
                onReset={reset}
            />

            <DppTable rows={filtered} total={dppForms.length} onResetFilters={reset} />
        </div>
    );
}

function PassportsListSkeleton() {
    return (
        <div className="space-y-4 p-4 md:p-8" aria-busy aria-label="Chargement des passeports">
            <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-8 w-full md:w-[280px]" />
                <Skeleton className="h-8 w-[140px]" />
            </div>
            <Card className="gap-0 overflow-hidden py-0">
                <div className="hidden h-11 border-b border-border bg-muted/40 md:block" />
                <div className="divide-y divide-border">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3.5 md:px-5">
                            <Skeleton className="size-9 shrink-0 rounded-lg" />
                            <div className="min-w-0 flex-1 space-y-2">
                                <Skeleton className="h-4 w-48 max-w-full" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                            <Skeleton className="h-5 w-20 shrink-0 rounded-md" />
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
