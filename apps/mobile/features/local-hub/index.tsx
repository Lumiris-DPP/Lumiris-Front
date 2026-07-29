'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { MapPin, SlidersHorizontal } from 'lucide-react';
import type { ArtisanWithSlug } from '@lumiris/mock-data';
import type { Repairer } from '@lumiris/types';
import { cn } from '@lumiris/ui/lib/cn';
import { useUserCoords } from '@/lib/geolocation/use-user-coords';
import { hasSeenGeolocPrompt, markGeolocPromptSeen } from '@/lib/geolocation/permission-storage';
import { useOnlineStatus } from '@/lib/network/use-online-status';
import { toast } from '@/lib/toast';
import { toLocalPoints } from './adapter';
import { FilterPills, type LocalFilter } from './filter-pills';
import { FilterSheet, EMPTY_FILTERS, DISTANCE_MAX_KM, activeFilterCount, type LocalFilters } from './filter-sheet';
import { ListView } from './list-view';
import { MapView } from './map-view';
import { MiniPointCard } from './mini-point-card';
import { PermissionPrompt } from './permission-prompt';
import type { LocalPoint } from './types';
import { ViewToggle, type LocalView } from './view-toggle';

export interface LocalHubProps {
    artisans: readonly ArtisanWithSlug[];
    repairers: readonly Repairer[];
}

export function LocalHub({ artisans, repairers }: LocalHubProps) {
    const online = useOnlineStatus();
    const { coords, status, request } = useUserCoords();
    const searchParams = useSearchParams();
    // Arrivée depuis "Réparer cette pièce" (?for=) → on cible d'emblée les retoucheurs.
    const forParam = searchParams.get('for');

    const [view, setView] = useState<LocalView>('list');
    const [kind, setKind] = useState<LocalFilter>(forParam ? 'repair' : 'all');
    const [filters, setFilters] = useState<LocalFilters>(EMPTY_FILTERS);
    const [filterSheetOpen, setFilterSheetOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [showGeolocPrompt, setShowGeolocPrompt] = useState(false);
    const [loading, setLoading] = useState(true);

    // Skeletons à l'entrée : simule le chargement de l'annuaire partenaires.
    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 450);
        return () => clearTimeout(timer);
    }, []);

    const points = useMemo(
        () => toLocalPoints(artisans, repairers, { userCoords: coords ?? undefined }),
        [artisans, repairers, coords],
    );

    const specialtyOptions = useMemo(() => {
        const set = new Set<string>();
        for (const point of points) for (const s of point.specialties ?? []) set.add(s);
        return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
    }, [points]);

    const distanceEnabled = coords !== null;

    // Filtres spécialité + distance (partagés entre Liste et Carte).
    const refined = useMemo(() => applyRefinements(points, filters), [points, filters]);

    const counts = useMemo<Record<LocalFilter, number>>(
        () => ({
            all: refined.length,
            buy: refined.filter((p) => p.kind === 'artisan').length,
            repair: refined.filter((p) => p.kind === 'repairer').length,
        }),
        [refined],
    );

    const filtered = useMemo(() => {
        if (kind === 'buy') return refined.filter((p) => p.kind === 'artisan');
        if (kind === 'repair') return refined.filter((p) => p.kind === 'repairer');
        return refined;
    }, [refined, kind]);

    useEffect(() => {
        if (view === 'map' && !online) {
            setView('list');
            setSelectedId(null);
            toast.info('Carte indisponible hors-ligne');
        }
    }, [online, view]);

    function handleViewChange(next: LocalView) {
        if (next === 'map' && !online) {
            toast.info('Carte indisponible hors-ligne');
            return;
        }
        setView(next);
        setSelectedId(null);
        if (next === 'map' && !hasSeenGeolocPrompt() && status !== 'granted') {
            setShowGeolocPrompt(true);
        }
    }

    function handleAcceptGeoloc() {
        markGeolocPromptSeen();
        setShowGeolocPrompt(false);
        request();
    }

    function handleDismissGeoloc() {
        markGeolocPromptSeen();
        setShowGeolocPrompt(false);
    }

    const selected = useMemo(() => {
        if (!selectedId) return null;
        return filtered.find((p) => `${p.kind}-${p.id}` === selectedId) ?? null;
    }, [filtered, selectedId]);

    const showDeniedBanner = view === 'map' && status === 'denied';
    const filterCount = activeFilterCount(filters);

    return (
        <div className="relative flex h-full flex-col bg-background">
            <header className="flex shrink-0 items-start justify-between gap-3 px-5 pt-12 pb-3">
                <div className="min-w-0">
                    <h1 className="text-xl font-bold text-foreground">Local</h1>
                    <p className="text-sm text-muted-foreground">Ateliers et retoucheurs partenaires près de toi</p>
                </div>
                <ViewToggle value={view} onChange={handleViewChange} />
            </header>

            <div className="sticky top-0 z-20 flex shrink-0 items-center gap-2 bg-background/85 px-5 pt-1 pb-3 backdrop-blur-xl">
                <div className="min-w-0 flex-1 overflow-x-auto">
                    <FilterPills value={kind} onChange={setKind} counts={counts} />
                </div>
                <button
                    type="button"
                    onClick={() => setFilterSheetOpen(true)}
                    aria-label={`Filtres${filterCount > 0 ? `, ${filterCount} actif${filterCount > 1 ? 's' : ''}` : ''}`}
                    className={cn(
                        'relative inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
                        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none',
                        filterCount > 0
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border/60 bg-card text-muted-foreground hover:text-foreground',
                    )}
                >
                    <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                    Filtres
                    {filterCount > 0 ? (
                        <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-[10px] font-bold text-primary-foreground tabular-nums">
                            {filterCount}
                        </span>
                    ) : null}
                </button>
            </div>

            {showDeniedBanner ? (
                <div className="mx-5 mb-3 flex shrink-0 items-center justify-between gap-2 rounded-2xl border border-border/40 bg-card/80 px-3 py-2 text-xs backdrop-blur-md">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" aria-hidden />
                        Position non partagée, tri par note.
                    </span>
                    <button
                        type="button"
                        onClick={() => setShowGeolocPrompt(true)}
                        className="font-semibold text-foreground underline-offset-2 hover:underline"
                    >
                        Réactiver
                    </button>
                </div>
            ) : null}

            <div className="relative min-h-0 flex-1">
                {view === 'list' ? (
                    <div className="absolute inset-0 overflow-y-auto pb-28">
                        <ListView points={filtered} loading={loading} showMarketplaceBanner={kind === 'buy'} />
                    </div>
                ) : (
                    <>
                        <MapView
                            points={filtered}
                            userCoords={coords}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                        />
                        <AnimatePresence>
                            {selected ? (
                                <div key="mini-card" className="pointer-events-none absolute inset-x-3 bottom-3 z-1000">
                                    <div className="pointer-events-auto">
                                        <MiniPointCard point={selected} onClose={() => setSelectedId(null)} />
                                    </div>
                                </div>
                            ) : null}
                        </AnimatePresence>
                    </>
                )}
            </div>

            <FilterSheet
                open={filterSheetOpen}
                onOpenChange={setFilterSheetOpen}
                specialtyOptions={specialtyOptions}
                filters={filters}
                onChange={setFilters}
                resultCount={filtered.length}
                distanceEnabled={distanceEnabled}
            />

            <AnimatePresence>
                {showGeolocPrompt ? (
                    <PermissionPrompt onAccept={handleAcceptGeoloc} onDismiss={handleDismissGeoloc} />
                ) : null}
            </AnimatePresence>
        </div>
    );
}

function applyRefinements(points: readonly LocalPoint[], filters: LocalFilters): LocalPoint[] {
    return points.filter((point) => {
        if (filters.specialties.length > 0) {
            const labels = point.specialties ?? [];
            if (!filters.specialties.some((s) => labels.includes(s))) return false;
        }
        if (filters.maxDistanceKm < DISTANCE_MAX_KM && point.distanceKm !== undefined) {
            if (point.distanceKm > filters.maxDistanceKm) return false;
        }
        return true;
    });
}
