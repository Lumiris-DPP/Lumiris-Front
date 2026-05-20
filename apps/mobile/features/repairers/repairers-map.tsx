'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { CITY_COORDS } from '@lumiris/mock-data';
import type { Repairer } from '@lumiris/types';
import { isLumirisLocal } from '@/lib/repairers/badge';

const RepairersMapClient = dynamic(() => import('./repairers-map.client').then((m) => m.RepairersMapClient), {
    ssr: false,
    loading: () => <MapPlaceholder />,
});

interface RepairersMapProps {
    repairers: readonly Repairer[];
    activeId?: string | null;
    onMarkerClick?: (repairerId: string) => void;
}

export function RepairersMap({ repairers, activeId, onMarkerClick }: RepairersMapProps) {
    // Dispersion stable par index pour éviter la superposition des pins d'une même ville.
    const pins = useMemo(() => {
        const buckets = new Map<string, number>();
        return repairers
            .map((r) => {
                const coords = r.coordinates ?? CITY_COORDS[r.city];
                if (!coords) return null;
                const slot = buckets.get(r.city) ?? 0;
                buckets.set(r.city, slot + 1);
                const offsetLat = (slot % 4) * 0.004 * (slot % 2 === 0 ? 1 : -1);
                const offsetLng = Math.floor(slot / 2) * 0.005 * (slot % 2 === 0 ? 1 : -1);
                return {
                    id: r.id,
                    lat: coords.lat + offsetLat,
                    lng: coords.lng + offsetLng,
                    label: r.atelierName ?? r.displayName,
                    highlighted: isLumirisLocal(r),
                };
            })
            .filter((pin): pin is NonNullable<typeof pin> => pin !== null);
    }, [repairers]);

    if (pins.length === 0) {
        return (
            <div
                className="border-border bg-card text-muted-foreground flex items-center justify-center rounded-2xl border text-[11px] italic"
                style={{ height: 220 }}
            >
                Aucun atelier à afficher sur la carte.
            </div>
        );
    }

    return <RepairersMapClient pins={pins} activeId={activeId} onMarkerClick={onMarkerClick} />;
}

function MapPlaceholder() {
    return (
        <div
            className="border-border bg-card text-muted-foreground flex items-center justify-center rounded-2xl border text-[11px] italic"
            style={{ height: 220 }}
        >
            Chargement de la carte…
        </div>
    );
}
