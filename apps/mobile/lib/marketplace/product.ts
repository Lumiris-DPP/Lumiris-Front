// Vue produit normalisée pour l'UI Boutique — projetée depuis le DTO backend
// (MarketplaceItemResponse, catalogue public réel). Le passeport (DPP) reste lié
// via dppFormId ; la fiche produit affiche les données réelles de l'annonce.

import type { MarketplaceItem as MarketplaceItemDto, MarketplaceVariant, SizeMeasurement } from '@lumiris/api-client';
import type { IrisGrade } from '@lumiris/types';

export interface MarketplaceItem {
    /** Identifiant produit — clé du panier et de la fiche Boutique. */
    id: string;
    /** DPP source (passeport numérique) rattaché à l'annonce, s'il existe. */
    dppFormId: string | null;
    /** Atelier vendeur — regroupe les lignes du panier en colis (un par atelier). */
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
    /** Déclinaisons vendables. Une annonce en a toujours au moins une. */
    variants: MarketplaceVariant[];
    /** Cotes relevées par l'atelier, en millimètres. */
    sizeGuide: SizeMeasurement[];
    /** Délai d'expédition promis à l'acheteur, congés de l'atelier inclus. 0 = pièce en stock. */
    preparationDays: number;
    /** Date de retour de l'atelier, quand il est en congés. */
    atelierPausedUntil: string | null;
    /** DTO d'origine — le cache des favoris est indexé dessus. */
    source: MarketplaceItemDto;
}

export type MarketplaceSort = 'relevance' | 'newest' | 'price-asc' | 'price-desc' | 'iris';

export const MARKETPLACE_SORT_LABEL: Record<MarketplaceSort, string> = {
    relevance: 'Pertinence',
    newest: 'Nouveautés',
    'price-asc': 'Prix croissant',
    'price-desc': 'Prix décroissant',
    iris: 'Score Iris',
};

// RÈGLE GRAVÉE : `relevance` vient en tête et reste le tri par défaut. Il ne dépend
// JAMAIS ni de la commission marketplace (~5%, masquée) ni du score Iris.
export const MARKETPLACE_SORT_ORDER: readonly MarketplaceSort[] = [
    'relevance',
    'newest',
    'price-asc',
    'price-desc',
    'iris',
];

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
        variants: dto.variants ?? [],
        sizeGuide: dto.sizeGuide ?? [],
        preparationDays: dto.effectivePreparationDays ?? 0,
        atelierPausedUntil: dto.atelierPausedUntil ?? null,
        source: dto,
    };
}

/** Libellé lisible d'une déclinaison, nul quand elle ne porte aucun axe. */
export function variantLabel(variant: MarketplaceVariant): string | null {
    const size = variant.sizeLabel?.trim();
    const color = variant.colorLabel?.trim();
    if (size && color) return `${size} · ${color}`;
    return size || color || null;
}

export function sizeOptionsOf(item: MarketplaceItem): readonly string[] {
    const sizes: string[] = [];
    for (const variant of item.variants) {
        const size = variant.sizeLabel?.trim();
        if (size && !sizes.includes(size)) sizes.push(size);
    }
    return sizes;
}

interface ColorOption {
    label: string;
    hex: string | null;
}

export function colorOptionsOf(item: MarketplaceItem): readonly ColorOption[] {
    const colors: ColorOption[] = [];
    for (const variant of item.variants) {
        const label = variant.colorLabel?.trim();
        if (label && !colors.some((c) => c.label === label)) {
            colors.push({ label, hex: variant.colorHex?.trim() || null });
        }
    }
    return colors;
}

export function findVariant(
    item: MarketplaceItem,
    size: string | null,
    color: string | null,
): MarketplaceVariant | null {
    return (
        item.variants.find(
            (variant) => (variant.sizeLabel?.trim() || null) === size && (variant.colorLabel?.trim() || null) === color,
        ) ?? null
    );
}

/** « Expédiée sous N jours », ou null pour une pièce en stock. */
export function preparationLabel(days: number): string | null {
    return days >= 1 ? `Expédiée sous ${days} jour${days > 1 ? 's' : ''}` : null;
}
