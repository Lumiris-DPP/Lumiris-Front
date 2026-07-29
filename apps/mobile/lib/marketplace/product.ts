// Vue produit normalisée pour l'UI Boutique — projetée depuis le DTO backend
// (MarketplaceItemResponse, catalogue public réel). Le passeport (DPP) reste lié
// via dppFormId ; la fiche produit affiche les données réelles de l'annonce.

import type { MarketplaceItem as MarketplaceItemDto } from '@lumiris/api-client';
import type { IrisGrade } from '@lumiris/types';

export interface MarketplaceItem {
    /** Identifiant produit — clé du panier et de la fiche Boutique. */
    id: string;
    /** DPP source (passeport numérique) rattaché à l'annonce, s'il existe. */
    dppFormId: string | null;
    /** Atelier vendeur — sert à garantir un panier mono-vendeur (destination charge unique). */
    artisanProfileId: string;
    name: string;
    description: string | null;
    category: string | null;
    material: string | null;
    originCountry: string | null;
    /** Prix en centimes (source de vérité) + en euros (affichage). */
    priceCents: number;
    price: number;
    currency: string;
    stock: number;
    photoUrl: string | null;
    artisanName: string;
    irisGrade: IrisGrade | null;
    irisTotal: number | null;
    createdAt: string | null;
    /** Frais de port de l'offre en centimes. `null` = inconnu, `0` = livraison offerte. */
    shippingCents: number | null;
    /** Conditions de retour affichées à l'acheteur avant paiement. */
    returnPolicy: string | null;
    /** Garantie / SAV annoncés par l'atelier. */
    warrantyDescription: string | null;
}

export type MarketplaceSort = 'relevance' | 'newest' | 'price-asc' | 'price-desc' | 'iris';

// RÈGLE GRAVÉE : le tri par défaut est NEUTRE (pertinence). Il ne dépend JAMAIS
// ni de la commission marketplace (~5%, masquée) ni du score Iris.
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

const GRADES: ReadonlySet<string> = new Set(['A', 'B', 'C', 'D', 'E']);

function asGrade(value: string | null | undefined): IrisGrade | null {
    return value && GRADES.has(value) ? (value as IrisGrade) : null;
}

/** Projette un article du catalogue public backend vers la vue Boutique. */
export function toMarketplaceItem(dto: MarketplaceItemDto): MarketplaceItem {
    return {
        id: dto.id,
        dppFormId: dto.dppFormId ?? null,
        artisanProfileId: dto.artisanProfileId,
        name: dto.name,
        description: dto.description ?? null,
        category: dto.category ?? null,
        material: dto.material ?? null,
        originCountry: dto.originCountry ?? null,
        priceCents: dto.priceCents,
        price: dto.priceCents / 100,
        currency: dto.currency,
        stock: dto.stock,
        photoUrl: dto.photoUrl ?? null,
        artisanName: dto.artisanName ?? 'Atelier indépendant',
        irisGrade: asGrade(dto.irisGrade),
        irisTotal: dto.irisTotal ?? null,
        createdAt: dto.createdAt ?? null,
        shippingCents: dto.shippingCents ?? null,
        returnPolicy: dto.returnPolicy ?? null,
        warrantyDescription: dto.warrantyDescription ?? null,
    };
}
