'use client';

import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RepairerMapPin {
    id: string;
    lat: number;
    lng: number;
    label: string;
    /** Atelier "LUMIRIS Local" — pin doré. */
    highlighted?: boolean;
}

interface RepairersMapClientProps {
    pins: readonly RepairerMapPin[];
    activeId?: string | null;
    onMarkerClick?: (id: string) => void;
}

const PIN_BASE = 'block h-3 w-3 rounded-full ring-4 shadow-lg';

const cyanIcon = L.divIcon({
    className: 'lumiris-repairer-pin',
    html: `<span class="${PIN_BASE} bg-lumiris-cyan ring-lumiris-cyan/30" aria-hidden="true"></span>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
});

const goldIcon = L.divIcon({
    className: 'lumiris-repairer-pin lumiris-repairer-pin--local',
    html: `<span class="${PIN_BASE} bg-lumiris-amber ring-lumiris-amber/30" aria-hidden="true"></span>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
});

const activeIcon = L.divIcon({
    className: 'lumiris-repairer-pin lumiris-repairer-pin--active',
    html: `<span class="block h-4 w-4 rounded-full bg-foreground ring-4 ring-foreground/30 shadow-lg" aria-hidden="true"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

function FitBounds({ pins }: { pins: readonly RepairerMapPin[] }) {
    const map = useMap();
    useEffect(() => {
        if (pins.length === 0) return;
        if (pins.length === 1) {
            const only = pins[0];
            if (only) map.setView([only.lat, only.lng], 12);
            return;
        }
        const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [24, 24], maxZoom: 12 });
    }, [map, pins]);
    return null;
}

export function RepairersMapClient({ pins, activeId, onMarkerClick }: RepairersMapClientProps) {
    const fallback = useMemo<[number, number]>(() => [46.6, 2.5], []);
    const initial = pins[0] ? ([pins[0].lat, pins[0].lng] as [number, number]) : fallback;
    const markerRefs = useRef<Map<string, L.Marker>>(new Map());

    useEffect(() => {
        if (!activeId) return;
        const marker = markerRefs.current.get(activeId);
        marker?.openPopup();
    }, [activeId]);

    return (
        <div className="border-border relative overflow-hidden rounded-2xl border" style={{ height: 220 }}>
            <MapContainer
                center={initial}
                zoom={6}
                scrollWheelZoom={false}
                attributionControl={false}
                className="h-full w-full"
            >
                <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
                <FitBounds pins={pins} />
                {pins.map((pin) => {
                    const icon = activeId === pin.id ? activeIcon : pin.highlighted ? goldIcon : cyanIcon;
                    return (
                        <Marker
                            key={pin.id}
                            position={[pin.lat, pin.lng]}
                            icon={icon}
                            ref={(instance) => {
                                if (instance) markerRefs.current.set(pin.id, instance);
                                else markerRefs.current.delete(pin.id);
                            }}
                            eventHandlers={{
                                click: () => onMarkerClick?.(pin.id),
                            }}
                        >
                            <Popup>
                                <span className="font-sans text-xs font-semibold">{pin.label}</span>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
