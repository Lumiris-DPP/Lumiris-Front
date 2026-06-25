// Couche "marketplace" posée par-dessus le modèle d'affiliation existant.
// Une annonce (Listing) = un passeport publié explicitement mis EN VENTE in-app,
// avec stock, frais de port et délai de livraison. Le modèle affilié (lien externe)
// reste disponible en parallèle sur le passeport ; ceci ajoute l'achat intégré.

import { mockArtisanById, mockPassports } from '@lumiris/mock-data';
import type { GarmentKind, Passport, ScoreResult } from '@lumiris/types';
import { scorePassport } from '../passport-score';

export interface Listing {
    /** Stock disponible (mocké). */
    stock: number;
    /** Frais de port en euros. */
    shippingFee: number;
    /** Délai de livraison estimé en jours. */
    shippingDays: number;
    /** Horodatage de mise en vente — utilisé pour le tri "Nouveautés". */
    listedAt: string;
}

export interface MarketplaceItem {
    passport: Passport;
    score: ScoreResult;
    artisanName: string;
    listing: Listing;
}

export type MarketplaceSort = 'relevance' | 'newest' | 'price-asc' | 'price-desc' | 'iris';

// RÈGLE GRAVÉE : le tri par défaut est NEUTRE (pertinence/nouveautés).
// Il ne dépend JAMAIS ni de la commission marketplace (~5%, masquée) ni du score Iris.
export const DEFAULT_MARKETPLACE_SORT: MarketplaceSort = 'relevance';

export const MARKETPLACE_SORT_LABEL: Record<MarketplaceSort, string> = {
    relevance: 'Pertinence',
    newest: 'Nouveautés',
    'price-asc': 'Prix croissant',
    'price-desc': 'Prix décroissant',
    iris: 'Score Iris',
};

export const MARKETPLACE_SORT_ORDER: readonly MarketplaceSort[] = [
    'relevance',
    'newest',
    'price-asc',
    'price-desc',
    'iris',
];

// Commission marketplace : interne, jamais montrée à l'acheteur, sans effet sur le tri.
export const MARKETPLACE_COMMISSION_RATE = 0.05;

// Passeports explicitement mis en vente in-app. Les autres restent consultables
// (et achetables via le lien atelier affilié) mais n'apparaissent pas dans la Boutique.
const LISTINGS: Readonly<Record<string, Listing>> = {
    'pass-marie-001': { stock: 6, shippingFee: 6, shippingDays: 4, listedAt: '2025-05-02T09:00:00.000Z' },
    'pass-amelie-001': { stock: 3, shippingFee: 8, shippingDays: 6, listedAt: '2025-06-14T09:00:00.000Z' },
    'pass-paul-001': { stock: 2, shippingFee: 9, shippingDays: 7, listedAt: '2025-04-21T09:00:00.000Z' },
    'pass-claire-001': { stock: 5, shippingFee: 6, shippingDays: 5, listedAt: '2025-06-30T09:00:00.000Z' },
    'pass-marie-002': { stock: 4, shippingFee: 6, shippingDays: 4, listedAt: '2025-03-18T09:00:00.000Z' },
};

const SORT_BY_LISTED_DESC = (a: MarketplaceItem, b: MarketplaceItem): number =>
    new Date(b.listing.listedAt).getTime() - new Date(a.listing.listedAt).getTime();

const SORT_BY_PRICE =
    (dir: 1 | -1) =>
    (a: MarketplaceItem, b: MarketplaceItem): number =>
        (a.passport.garment.retailPrice - b.passport.garment.retailPrice) * dir;

const SORT_BY_IRIS = (a: MarketplaceItem, b: MarketplaceItem): number => b.score.total - a.score.total;

// Tri "pertinence" : stable et neutre (référence alphabétique). Aucun lien commission/score.
const SORT_BY_RELEVANCE = (a: MarketplaceItem, b: MarketplaceItem): number =>
    a.passport.garment.reference.localeCompare(b.passport.garment.reference, 'fr', { sensitivity: 'base' });

function comparatorFor(sort: MarketplaceSort): (a: MarketplaceItem, b: MarketplaceItem) => number {
    switch (sort) {
        case 'newest':
            return SORT_BY_LISTED_DESC;
        case 'price-asc':
            return SORT_BY_PRICE(1);
        case 'price-desc':
            return SORT_BY_PRICE(-1);
        case 'iris':
            return SORT_BY_IRIS;
        case 'relevance':
        default:
            return SORT_BY_RELEVANCE;
    }
}

export function getListing(passportId: string): Listing | null {
    return LISTINGS[passportId] ?? null;
}

export function isForSale(passportId: string): boolean {
    return passportId in LISTINGS;
}

function toMarketplaceItem(passport: Passport, now: Date): MarketplaceItem {
    return {
        passport,
        score: scorePassport(passport, now),
        artisanName: mockArtisanById(passport.artisanId)?.atelierName ?? 'Atelier indépendant',
        listing: LISTINGS[passport.id] as Listing,
    };
}

export function getMarketplaceItems(now: Date, sort: MarketplaceSort = DEFAULT_MARKETPLACE_SORT): MarketplaceItem[] {
    return mockPassports
        .filter((p) => p.status === 'Published' && isForSale(p.id))
        .map((p) => toMarketplaceItem(p, now))
        .sort(comparatorFor(sort));
}

export function getMarketplaceItem(passportId: string, now: Date): MarketplaceItem | null {
    const passport = mockPassports.find((p) => p.id === passportId && p.status === 'Published');
    if (!passport || !isForSale(passportId)) return null;
    return toMarketplaceItem(passport, now);
}
