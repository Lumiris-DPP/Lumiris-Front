export interface CityCoords {
    name: string;
    lat: number;
    lng: number;
    postalPrefix?: string;
}

export const CITY_COORDS: Record<string, CityCoords> = {
    Quimper: { name: 'Quimper', lat: 47.997, lng: -4.097, postalPrefix: '29' },
    Lyon: { name: 'Lyon', lat: 45.764, lng: 4.835, postalPrefix: '69' },
    'Romans-sur-Isère': { name: 'Romans-sur-Isère', lat: 45.045, lng: 5.052, postalPrefix: '26' },
    Lille: { name: 'Lille', lat: 50.629, lng: 3.057, postalPrefix: '59' },
    Marseille: { name: 'Marseille', lat: 43.296, lng: 5.369, postalPrefix: '13' },
    Bordeaux: { name: 'Bordeaux', lat: 44.837, lng: -0.579, postalPrefix: '33' },
    Reims: { name: 'Reims', lat: 49.258, lng: 4.031, postalPrefix: '51' },
    Castres: { name: 'Castres', lat: 43.606, lng: 2.241, postalPrefix: '81' },
    Mazamet: { name: 'Mazamet', lat: 43.494, lng: 2.374, postalPrefix: '81' },
    Graulhet: { name: 'Graulhet', lat: 43.766, lng: 1.985, postalPrefix: '81' },
    Nantes: { name: 'Nantes', lat: 47.218, lng: -1.553, postalPrefix: '44' },
    Paris: { name: 'Paris', lat: 48.857, lng: 2.351, postalPrefix: '75' },
};

export const POSTAL_PREFIX_TO_CITY: Record<string, string> = {
    '29': 'Quimper',
    '69': 'Lyon',
    '26': 'Romans-sur-Isère',
    '59': 'Lille',
    '13': 'Marseille',
    '33': 'Bordeaux',
    '51': 'Reims',
    '81': 'Castres',
    '44': 'Nantes',
    '75': 'Paris',
};

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
    const R = 6371;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

export function cityFromPostalCode(cp: string | undefined | null): CityCoords | undefined {
    if (!cp) return undefined;
    const trimmed = cp.trim();
    if (trimmed.length < 2) return undefined;
    const two = trimmed.slice(0, 2);
    const cityName = POSTAL_PREFIX_TO_CITY[two];
    return cityName ? CITY_COORDS[cityName] : undefined;
}
