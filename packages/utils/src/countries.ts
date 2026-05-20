export interface Country {
    code: string;
    label: string;
    latitude?: number;
    longitude?: number;
}

export const COUNTRIES: readonly Country[] = [
    { code: 'FR', label: 'France', latitude: 46.2, longitude: 2.2 },
    { code: 'IT', label: 'Italie', latitude: 42.8, longitude: 12.6 },
    { code: 'ES', label: 'Espagne', latitude: 40.5, longitude: -3.7 },
    { code: 'PT', label: 'Portugal', latitude: 39.4, longitude: -8.2 },
    { code: 'BE', label: 'Belgique', latitude: 50.5, longitude: 4.5 },
    { code: 'NL', label: 'Pays-Bas', latitude: 52.1, longitude: 5.3 },
    { code: 'DE', label: 'Allemagne', latitude: 51.2, longitude: 10.4 },
    { code: 'CH', label: 'Suisse', latitude: 46.8, longitude: 8.2 },
    { code: 'GB', label: 'Royaume-Uni', latitude: 54.0, longitude: -2.0 },
    { code: 'IE', label: 'Irlande', latitude: 53.0, longitude: -8.0 },
    { code: 'MA', label: 'Maroc', latitude: 31.8, longitude: -7.0 },
    { code: 'TN', label: 'Tunisie', latitude: 34.0, longitude: 9.0 },
    { code: 'EG', label: 'Égypte', latitude: 26.8, longitude: 30.8 },
    { code: 'TR', label: 'Turquie', latitude: 38.9, longitude: 35.2 },
    { code: 'IN', label: 'Inde', latitude: 22.0, longitude: 79.0 },
    { code: 'CN', label: 'Chine', latitude: 35.0, longitude: 104.0 },
    { code: 'MN', label: 'Mongolie', latitude: 46.9, longitude: 103.8 },
    { code: 'US', label: 'États-Unis', latitude: 39.5, longitude: -98.0 },
];

const COUNTRY_BY_CODE: ReadonlyMap<string, Country> = new Map(COUNTRIES.map((c) => [c.code, c]));

export function findCountry(code: string | undefined | null): Country | undefined {
    if (!code) return undefined;
    return COUNTRY_BY_CODE.get(code.toUpperCase());
}
