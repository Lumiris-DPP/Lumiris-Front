'use client';

import dynamic from 'next/dynamic';
import type { LocalPoint } from './types';
import type { UserCoords } from '@/lib/geolocation/use-user-coords';

const MapClient = dynamic(() => import('./map-view.client').then((m) => m.MapClient), {
    ssr: false,
    loading: () => <div className="absolute inset-0 animate-pulse bg-card/40" />,
});

interface MapViewProps {
    points: readonly LocalPoint[];
    userCoords: UserCoords | null;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onMoveEnd: (center: { lat: number; lng: number }) => void;
}

export function MapView(props: MapViewProps) {
    return (
        // ponytail: isolate contains Leaflet's internal panes (z-index up to 700), which would
        // otherwise leak into the parent stacking context and paint over siblings like the z-40
        // PermissionPrompt regardless of DOM order.
        <div className="absolute inset-0 isolate z-0">
            <MapClient {...props} />
        </div>
    );
}
