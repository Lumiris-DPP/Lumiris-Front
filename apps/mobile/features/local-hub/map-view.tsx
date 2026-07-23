import { lazy, Suspense } from 'react';
import type { LocalPoint } from './types';
import type { UserCoords } from '@/lib/geolocation/use-user-coords';

const MapClient = lazy(() => import('./map-view.client').then((m) => ({ default: m.MapClient })));

interface MapViewProps {
    points: readonly LocalPoint[];
    userCoords: UserCoords | null;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
}

export function MapView(props: MapViewProps) {
    return (
        <div className="absolute inset-0">
            <Suspense fallback={<div className="bg-card/40 absolute inset-0 animate-pulse" />}>
                <MapClient {...props} />
            </Suspense>
        </div>
    );
}
