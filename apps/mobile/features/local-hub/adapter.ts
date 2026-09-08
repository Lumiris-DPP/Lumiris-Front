import type { ArtisanPublicProfileResponse, RepairerSearchResult } from '@lumiris/api-client';
import type { LocalPoint } from './types';

export function toLocalPoints(
    artisans: readonly ArtisanPublicProfileResponse[],
    repairers: readonly RepairerSearchResult[],
): LocalPoint[] {
    const points: LocalPoint[] = [];

    for (const a of artisans) {
        points.push({
            kind: 'artisan',
            id: a.slug,
            slug: a.slug,
            name: a.atelierName ?? a.displayName ?? 'Atelier',
            city: a.city ?? '',
            region: a.region ?? '',
            // Artisans have no stored coordinates on the backend yet, so they can't be placed
            // on the map or geo-sorted — they still show up in the list view.
            coords: undefined,
            distanceKm: undefined,
            photoUrl: a.photoUrls[0],
            specialties: a.specialties ?? [],
        });
    }

    for (const r of repairers) {
        points.push({
            kind: 'repairer',
            id: r.id,
            slug: r.id,
            name: r.displayName ?? r.companyName ?? 'Retoucheur',
            city: r.city ?? '',
            region: r.region ?? '',
            coords: { lat: r.lat, lng: r.lng },
            distanceKm: r.distanceKm,
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
