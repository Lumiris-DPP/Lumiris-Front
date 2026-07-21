'use client';

import { Component, useEffect, useMemo, type ReactNode } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface OriginMapOriginPoint {
    id: string;
    label: string;
    country?: string | null;
    latitude?: number | null;
    longitude?: number | null;
}

export interface OriginMapStepPoint {
    id: string;
    order: number;
    label: string;
    sublabel?: string | null;
    city?: string | null;
    country?: string | null;
    latitude?: number | null;
    longitude?: number | null;
}

export interface OriginMapProps {
    origins: readonly OriginMapOriginPoint[];
    steps: readonly OriginMapStepPoint[];
}

const originIcon = L.divIcon({
    className: 'lumiris-map-pin-amber',
    html: '<span class="block h-3 w-3 rounded-full bg-amber-500 ring-4 ring-amber-500/30 shadow-lg" aria-hidden="true"></span>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
});

const stepIcon = L.divIcon({
    className: 'lumiris-map-pin',
    html: '<span class="block h-3 w-3 rounded-full bg-lumiris-cyan ring-4 ring-lumiris-cyan/30 shadow-lg" aria-hidden="true"></span>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
});

const stepIconEdge = L.divIcon({
    className: 'lumiris-map-pin-emerald',
    html: '<span class="block h-4 w-4 rounded-full bg-lumiris-emerald ring-4 ring-lumiris-emerald/30 shadow-lg" aria-hidden="true"></span>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

interface Located {
    id: string;
    lat: number;
    lng: number;
}

function hasCoords<T extends { latitude?: number | null; longitude?: number | null }>(
    point: T,
): point is T & { latitude: number; longitude: number } {
    return typeof point.latitude === 'number' && typeof point.longitude === 'number';
}

export function OriginMap({ origins, steps }: OriginMapProps) {
    const originPoints = useMemo(() => origins.filter(hasCoords), [origins]);
    const stepPoints = useMemo(
        () =>
            steps
                .filter(hasCoords)
                .slice()
                .sort((a, b) => a.order - b.order),
        [steps],
    );

    const allPoints: Located[] = useMemo(
        () => [
            ...originPoints.map((p) => ({ id: `origin-${p.id}`, lat: p.latitude, lng: p.longitude })),
            ...stepPoints.map((p) => ({ id: `step-${p.id}`, lat: p.latitude, lng: p.longitude })),
        ],
        [originPoints, stepPoints],
    );

    if (allPoints.length === 0) {
        return <OriginMapFallback origins={origins} steps={steps} reason="empty" />;
    }

    const center: [number, number] = [
        allPoints.reduce((sum, p) => sum + p.lat, 0) / allPoints.length,
        allPoints.reduce((sum, p) => sum + p.lng, 0) / allPoints.length,
    ];

    const path: Array<[number, number]> = stepPoints.map((p) => [p.latitude, p.longitude]);

    return (
        <OriginMapErrorBoundary origins={origins} steps={steps}>
            <div className="flex flex-col gap-3">
                <div className="border-border relative h-72 w-full overflow-hidden rounded-2xl border">
                    <MapContainer
                        center={center}
                        zoom={5}
                        scrollWheelZoom={false}
                        className="h-full w-full"
                        attributionControl={false}
                    >
                        <TileLayer
                            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="&copy; OpenStreetMap"
                            maxZoom={19}
                        />
                        <FitBounds points={allPoints} />
                        {path.length > 1 ? (
                            <Polyline
                                positions={path}
                                pathOptions={{ color: '#06b6d4', weight: 2, dashArray: '4 6', opacity: 0.8 }}
                            />
                        ) : null}
                        {originPoints.map((p) => (
                            <Marker key={`origin-${p.id}`} position={[p.latitude, p.longitude]} icon={originIcon}>
                                <Popup>
                                    <div className="font-sans">
                                        <p className="text-xs font-semibold">Origine · {p.label}</p>
                                        {p.country ? <p className="text-[11px] opacity-70">{p.country}</p> : null}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                        {stepPoints.map((p, idx) => (
                            <Marker
                                key={`step-${p.id}`}
                                position={[p.latitude, p.longitude]}
                                icon={idx === 0 || idx === stepPoints.length - 1 ? stepIconEdge : stepIcon}
                            >
                                <Popup>
                                    <div className="font-sans">
                                        <p className="text-xs font-semibold">
                                            {p.order}. {p.label}
                                        </p>
                                        {p.sublabel || p.city ? (
                                            <p className="text-[11px] opacity-70">
                                                {[p.sublabel, p.city].filter(Boolean).join(' · ')}
                                            </p>
                                        ) : null}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
                {/* Screen-reader companion: the map above conveys geography visually, this conveys the same facts as text. */}
                <LocationList origins={origins} steps={steps} visuallyHidden />
            </div>
        </OriginMapErrorBoundary>
    );
}

function FitBounds({ points }: { points: readonly Located[] }) {
    const map = useMap();
    useEffect(() => {
        if (points.length < 2) return;
        const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [24, 24] });
    }, [map, points]);
    return null;
}

function LocationList({
    origins,
    steps,
    visuallyHidden = false,
}: {
    origins: readonly OriginMapOriginPoint[];
    steps: readonly OriginMapStepPoint[];
    visuallyHidden?: boolean;
}) {
    return (
        <div className={visuallyHidden ? 'sr-only' : 'border-border bg-card rounded-2xl border p-4'}>
            {origins.length > 0 ? (
                <div>
                    <h3 className={visuallyHidden ? undefined : 'text-foreground mb-2 text-sm font-semibold'}>
                        Origine des matières
                    </h3>
                    <ul className={visuallyHidden ? undefined : 'flex flex-wrap gap-2'}>
                        {origins.map((o) => (
                            <li
                                key={o.id}
                                className={
                                    visuallyHidden
                                        ? undefined
                                        : 'border-border bg-muted rounded-full border px-3 py-1 text-xs'
                                }
                            >
                                {o.label}
                                {o.country ? ` — ${o.country}` : ''}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
            {steps.length > 0 ? (
                <div className={visuallyHidden ? undefined : 'mt-4'}>
                    <h3 className={visuallyHidden ? undefined : 'text-foreground mb-2 text-sm font-semibold'}>
                        Étapes de fabrication
                    </h3>
                    <ol className={visuallyHidden ? undefined : 'flex flex-col gap-1'}>
                        {steps.map((s) => (
                            <li key={s.id} className={visuallyHidden ? undefined : 'text-xs'}>
                                {s.order}. {s.label}
                                {s.city
                                    ? ` — ${s.city}${s.country ? `, ${s.country}` : ''}`
                                    : s.country
                                      ? ` — ${s.country}`
                                      : ''}
                            </li>
                        ))}
                    </ol>
                </div>
            ) : null}
        </div>
    );
}

function OriginMapFallback({
    origins,
    steps,
    reason,
}: {
    origins: readonly OriginMapOriginPoint[];
    steps: readonly OriginMapStepPoint[];
    reason: 'empty' | 'error';
}) {
    if (origins.length === 0 && steps.length === 0) {
        return (
            <div className="border-border bg-card text-muted-foreground flex h-48 items-center justify-center rounded-2xl border text-xs italic">
                Aucune localisation renseignée pour cette pièce.
            </div>
        );
    }
    return (
        <div className="border-border bg-card rounded-2xl border p-4">
            <p className="text-muted-foreground mb-3 text-xs italic">
                {reason === 'error'
                    ? "La carte n'a pas pu être chargée. Voici les lieux renseignés :"
                    : 'Coordonnées manquantes pour afficher la carte. Voici les lieux renseignés :'}
            </p>
            <LocationList origins={origins} steps={steps} />
        </div>
    );
}

interface OriginMapErrorBoundaryProps {
    origins: readonly OriginMapOriginPoint[];
    steps: readonly OriginMapStepPoint[];
    children: ReactNode;
}

class OriginMapErrorBoundary extends Component<OriginMapErrorBoundaryProps, { hasError: boolean }> {
    override state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    override render() {
        if (this.state.hasError) {
            return <OriginMapFallback origins={this.props.origins} steps={this.props.steps} reason="error" />;
        }
        return this.props.children;
    }
}
