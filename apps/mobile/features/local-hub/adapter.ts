import { CITY_COORDS, distanceKm, mockPassportsByArtisan, type ArtisanWithSlug } from '@lumiris/mock-data';
import type { IrisGrade, Repairer, RepairerSpecialty } from '@lumiris/types';
import { SPECIALTY_TO_SECTOR } from '@lumiris/types';
import { scorePassport } from '@/lib/passport-score';
import type { LocalPoint } from './types';

const REPAIRER_SPECIALTY_LABEL: Record<RepairerSpecialty, string> = {
    alteration: 'Retouches',
    embroidery: 'Broderie',
    'shoe-repair': 'Cordonnerie',
    leather: 'Cuir',
    lining: 'Doublures',
    'electronics-repair': 'Électronique',
    'phone-repair': 'Téléphonie',
    'computer-repair': 'Informatique',
    cabinetmaking: 'Ébénisterie',
    upholstery: 'Tapisserie',
    'appliance-repair': 'Électroménager',
};

export function toLocalPoints(
    artisans: readonly ArtisanWithSlug[],
    repairers: readonly Repairer[],
    options: { userCoords?: { lat: number; lng: number }; now?: Date } = {},
): LocalPoint[] {
    const now = options.now ?? new Date();
    const points: LocalPoint[] = [];

    for (const a of artisans) {
        const coords = CITY_COORDS[a.city];
        const passports = mockPassportsByArtisan(a.id).filter((p) => p.status === 'Published');
        const grades = passports.map((p) => scorePassport(p, now).grade);
        const [firstGrade, ...restGrades] = grades;
        points.push({
            kind: 'artisan',
            id: a.id,
            slug: a.slug,
            name: a.atelierName,
            city: a.city,
            region: a.region,
            coords,
            distanceKm: coords && options.userCoords ? distanceKm(options.userCoords, coords) : undefined,
            photoUrl: a.photoUrl,
            averageGrade: firstGrade ? mostFrequent(firstGrade, restGrades) : undefined,
            publishedPassports: passports.length,
            specialties: a.specialities,
        });
    }

    for (const r of repairers) {
        const coords = CITY_COORDS[r.city];
        const [firstSpecialty] = r.specialities;
        points.push({
            kind: 'repairer',
            id: r.id,
            slug: r.id,
            name: r.displayName,
            city: r.city,
            region: r.region,
            coords,
            distanceKm: coords && options.userCoords ? distanceKm(options.userCoords, coords) : undefined,
            rating: r.avgRating,
            reviewCount: r.reviewCount,
            avgDelayDays: r.avgDelayDays,
            priceRange: { min: r.priceRange.min, max: r.priceRange.max },
            specialties: r.specialities.map((s) => REPAIRER_SPECIALTY_LABEL[s]),
            sector: firstSpecialty ? SPECIALTY_TO_SECTOR[firstSpecialty] : undefined,
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

function mostFrequent(first: IrisGrade, rest: readonly IrisGrade[]): IrisGrade {
    const counts = new Map<IrisGrade, number>([[first, 1]]);
    for (const item of rest) counts.set(item, (counts.get(item) ?? 0) + 1);
    let best: IrisGrade = first;
    let bestCount = counts.get(first) ?? 1;
    for (const [grade, count] of counts) {
        if (count > bestCount) {
            best = grade;
            bestCount = count;
        }
    }
    return best;
}
