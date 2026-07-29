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
}

export function MapView(props: MapViewProps) {
    return (
        <div className="absolute inset-0">
            <MapClient {...props} />
        </div>
    );
}
