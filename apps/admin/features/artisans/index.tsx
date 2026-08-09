'use client';

import { Suspense, memo, useEffect, useMemo, useState } from 'react';
import { mockArtisans, mockPassports, mockRepairers } from '@lumiris/mock-data';
import { type Artisan } from '@lumiris/types';
import { DataTableFilters } from '@lumiris/ui/components/data-table-filters';
import { FeatureLayout } from '@lumiris/ui/components/feature-layout';
import { TooltipProvider } from '@lumiris/ui/components/tooltip';
import { useAdminAuditLog } from '@/lib/auth';
import { buildArtisanRows, type ArtisanRow } from '@/lib/artisan-analytics';
import { ArtisanDrawer } from './artisan-drawer';
import { ArtisanTable } from './artisan-table';
import { useDeepLinkId } from './deep-link';
import { RealArtisanAccounts } from './real-accounts';
import { HEALTH_OPTIONS, type HealthFilter } from './tier-status';

const SCORING_NOW = new Date('2026-04-30T08:00:00Z');

function ArtisansComponent() {
    return (
        <Suspense fallback={null}>
            <ArtisansInner />
        </Suspense>
    );
}

function ArtisansInner() {
    const { selectedId, setSelectedId } = useDeepLinkId();
    const auditLog = useAdminAuditLog();

    const [search, setSearch] = useState('');
    const [healthFilter, setHealthFilter] = useState<HealthFilter>('all');

    const rows: readonly ArtisanRow[] = useMemo(
        () => buildArtisanRows(mockArtisans, mockPassports, mockRepairers, auditLog, SCORING_NOW),
        [auditLog],
    );

    const selected: Artisan | null = useMemo(
        () => (selectedId ? (rows.find((r) => r.artisan.id === selectedId)?.artisan ?? null) : null),
        [selectedId, rows],
    );

    useEffect(() => {
        if (!selectedId) return;
        if (!rows.some((r) => r.artisan.id === selectedId)) setSelectedId(null);
    }, [selectedId, rows, setSelectedId]);

    const filtered = useMemo(() => {
        return rows.filter((r) => {
            if (healthFilter === 'lt50' && r.health.total >= 50) return false;
            if (healthFilter === 'gte80capacity' && r.health.capacityUtilization < 80) return false;
            if (search.trim().length > 0) {
                const needle = search.toLowerCase();
                const haystack =
                    `${r.artisan.atelierName} ${r.artisan.displayName} ${r.artisan.city} ${r.artisan.id}`.toLowerCase();
                if (!haystack.includes(needle)) return false;
            }
            return true;
        });
    }, [rows, search, healthFilter]);

    const resetFilters = () => {
        setSearch('');
        setHealthFilter('all');
    };

    return (
        <TooltipProvider>
            <FeatureLayout title="Artisans">
                <div className="space-y-8">
                    <DataTableFilters
                        search={{ value: search, onChange: setSearch, placeholder: 'Atelier, nom, ville…' }}
                        filters={[
                            {
                                label: 'Santé',
                                value: healthFilter,
                                onChange: (v) => setHealthFilter(v as HealthFilter),
                                options: HEALTH_OPTIONS,
                            },
                        ]}
                        onReset={resetFilters}
                    />

                    <ArtisanTable rows={filtered} onSelect={(a) => setSelectedId(a.id)} onResetFilters={resetFilters} />

                    <ArtisanDrawer artisan={selected} onClose={() => setSelectedId(null)} />

                    <div className="space-y-3">
                        <div>
                            <h2 className="text-foreground text-sm font-semibold">Comptes réels (ATELIER)</h2>
                            <p className="text-muted-foreground text-xs">
                                Comptes artisan inscrits sur le vrai backend — distinct du jeu de données de démo
                                ci-dessus. Cliquez sur un compte pour consulter son dossier KYB.
                            </p>
                        </div>
                        <RealArtisanAccounts />
                    </div>
                </div>
            </FeatureLayout>
        </TooltipProvider>
    );
}

export const Artisans = memo(ArtisansComponent);
