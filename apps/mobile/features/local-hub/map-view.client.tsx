'use client';

import { useEffect, useMemo, useRef } from 'react';
import { CircleMarker, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LocalPoint } from './types';
import type { UserCoords } from '@/lib/geolocation/use-user-coords';

const FRANCE_CENTER: [number, number] = [46.6, 2.5];
const MAX_MARKERS = 50;

const STORE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true"><path d="M3 9l1-5h16l1 5"/><path d="M5 9v11h14V9"/><path d="M10 20v-5h4v5"/></svg>`;

const WRENCH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;

function buildIcon(color: string, glowAlpha: string, svg: string, active: boolean): L.DivIcon {
    const size = active ? 38 : 30;
    const ring = active
        ? `box-shadow: 0 0 0 5px ${color}${glowAlpha}, 0 6px 16px rgba(0,0,0,0.18);`
        : 'box-shadow: 0 4px 10px rgba(0,0,0,0.18);';
    const html = `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:2px solid #ffffff;display:flex;align-items:center;justify-content:center;cursor:pointer;${ring}">${svg}</div>`;
    return L.divIcon({
        className: 'lumiris-local-pin',
        html,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
}

const ARTISAN_COLOR = '#8021f3'; // lumiris-iris (distinct du cyan retoucheur)
const REPAIRER_COLOR = '#06b6d4'; // lumiris-cyan

function ResizeOnMount() {
    const map = useMap();
    useEffect(() => {
        const t1 = setTimeout(() => map.invalidateSize(), 0);
        const t2 = setTimeout(() => map.invalidateSize(), 250);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [map]);
    return null;
}

function CenterOnUser({ userCoords }: { userCoords: UserCoords | null }) {
    const map = useMap();
    const appliedRef = useRef(false);
    useEffect(() => {
        if (!userCoords || appliedRef.current) return;
        map.setView([userCoords.lat, userCoords.lng], 11, { animate: true });
        appliedRef.current = true;
    }, [map, userCoords]);
    return null;
}

function DeselectOnMapClick({ onSelect }: { onSelect: (id: string | null) => void }) {
    const map = useMap();
    useEffect(() => {
        const handler = () => onSelect(null);
        map.on('click', handler);
        return () => {
            map.off('click', handler);
        };
    }, [map, onSelect]);
    return null;
}

interface MapClientProps {
    points: readonly LocalPoint[];
    userCoords: UserCoords | null;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
}

export function MapClient({ points, userCoords, selectedId, onSelect }: MapClientProps) {
    const visiblePoints = useMemo(() => points.filter((p) => p.coords !== undefined).slice(0, MAX_MARKERS), [points]);

    const totalWithCoords = useMemo(() => points.filter((p) => p.coords !== undefined).length, [points]);

    const hiddenCount = Math.max(0, totalWithCoords - visiblePoints.length);

    const initialCenter: [number, number] = userCoords ? [userCoords.lat, userCoords.lng] : FRANCE_CENTER;
    const initialZoom = userCoords ? 11 : 6;

    const icons = useMemo(
        () => ({
            artisan: buildIcon(ARTISAN_COLOR, '40', STORE_SVG, false),
            artisanActive: buildIcon(ARTISAN_COLOR, '40', STORE_SVG, true),
            repairer: buildIcon(REPAIRER_COLOR, '40', WRENCH_SVG, false),
            repairerActive: buildIcon(REPAIRER_COLOR, '40', WRENCH_SVG, true),
        }),
        [],
    );

    return (
        <div className="absolute inset-0">
            <MapContainer
                center={initialCenter}
                zoom={initialZoom}
                scrollWheelZoom
                attributionControl={false}
                style={{ position: 'absolute', inset: 0, height: '100%', width: '100%' }}
            >
                <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
                <ResizeOnMount />
                <CenterOnUser userCoords={userCoords} />
                <DeselectOnMapClick onSelect={onSelect} />

                {userCoords ? (
                    <CircleMarker
                        center={[userCoords.lat, userCoords.lng]}
                        radius={7}
                        pathOptions={{
                            color: '#ffffff',
                            weight: 2,
                            fillColor: '#0e6e88',
                            fillOpacity: 0.95,
                        }}
                        interactive={false}
                    />
                ) : null}

                {visiblePoints.map((point) => {
                    if (!point.coords) return null;
                    const id = `${point.kind}-${point.id}`;
                    const active = selectedId === id;
                    const icon =
                        point.kind === 'artisan'
                            ? active
                                ? icons.artisanActive
                                : icons.artisan
                            : active
                              ? icons.repairerActive
                              : icons.repairer;
                    return (
                        <Marker
                            key={id}
                            position={[point.coords.lat, point.coords.lng]}
                            icon={icon}
                            zIndexOffset={active ? 1000 : 0}
                            eventHandlers={{
                                click: (event) => {
                                    L.DomEvent.stopPropagation(event);
                                    onSelect(active ? null : id);
                                },
                            }}
                        />
                    );
                })}
            </MapContainer>

            {visiblePoints.length === 0 ? (
                <div className="pointer-events-none absolute inset-0 z-500 flex items-center justify-center px-6">
                    <p className="rounded-2xl border border-border/40 bg-card/90 px-4 py-3 text-center text-xs text-muted-foreground backdrop-blur-md">
                        Aucun point partenaire pour ce filtre.
                    </p>
                </div>
            ) : null}

            {hiddenCount > 0 ? (
                <div className="pointer-events-none absolute top-3 left-3 z-500">
                    <span className="rounded-full border border-border/40 bg-card/90 px-3 py-1 text-[11px] font-semibold text-muted-foreground backdrop-blur-md">
                        +{hiddenCount} autre{hiddenCount > 1 ? 's' : ''} ateliers
                    </span>
                </div>
            ) : null}
        </div>
    );
}
