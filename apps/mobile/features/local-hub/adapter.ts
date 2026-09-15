import type { ArtisanPublicProfileResponse, RepairerSearchResult } from '@lumiris/api-client';
import type { LocalPoint } from './types';

const EARTH_RADIUS_KM = 6371;

// ponytail: haversine, good enough at map zoom levels — no need for a geo library for one distance calc.
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const sinLat = Math.sin(dLat / 2);
    const sinLng = Math.sin(dLng / 2);
    const h = sinLat * sinLat + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinLng * sinLng;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function toLocalPoints(
    artisans: readonly ArtisanPublicProfileResponse[],
    repairers: readonly RepairerSearchResult[],
    // Ateliers SELF (pas d'adresse SIRENE géocodée) restent sans coords : liste uniquement.
    origin: { lat: number; lng: number },
): LocalPoint[] {
    const points: LocalPoint[] = [];

    for (const a of artisans) {
        const coords = a.lat != null && a.lng != null ? { lat: a.lat, lng: a.lng } : undefined;
        points.push({
            kind: 'artisan',
            id: a.slug,
            slug: a.slug,
            name: a.atelierName ?? a.displayName ?? 'Atelier',
            city: a.city ?? '',
            region: a.region ?? '',
            coords,
            distanceKm: coords ? haversineKm(origin, coords) : undefined,
            photoUrl: a.photoUrls[0],
            specialties: a.specialties ?? [],
            claimed: a.claimed ?? true,
        });
    }

    for (const r of repairers) {
        const coords = r.lat != null && r.lng != null ? { lat: r.lat, lng: r.lng } : undefined;
        points.push({
            kind: 'repairer',
            id: r.id,
            slug: r.id,
            name: r.displayName ?? r.companyName ?? 'Retoucheur',
            city: r.city ?? '',
            region: r.region ?? '',
            coords,
            distanceKm: r.distanceKm,
            rating: r.averageRating,
            reviewCount: r.reviewCount,
            claimed: r.claimed ?? true,
            specialties: r.specialties ?? [],
        });
    }

    return sortPoints(points);
}

function sortPoints(points: LocalPoint[]): LocalPoint[] {
    return points.sort((a, b) => {
        const ad = a.distanceKm;
        const bd = b.distanceKm;
        if (ad !== undefined && bd !== undefined) return ad - bd;
        if (ad !== undefined) return -1;
        if (bd !== undefined) return 1;
        if (a.kind !== b.kind) return a.kind === 'artisan' ? -1 : 1;
        return a.name.localeCompare(b.name, 'fr');
    });
}
