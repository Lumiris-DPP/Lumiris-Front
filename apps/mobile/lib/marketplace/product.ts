import type { MarketplaceItem as MarketplaceItemDto, MarketplaceVariant, SizeMeasurement } from '@lumiris/api-client';
import type { IrisGrade } from '@lumiris/types';

export interface MarketplaceItem {
    id: string;

    dppFormId: string | null;

    artisanProfileId: string;
    name: string;
    description: string | null;
    category: string | null;
    material: string | null;
    originCountry: string | null;

    priceCents: number;
    price: number;
    currency: string;
    stock: number;
    photoUrl: string | null;
    artisanName: string;
    irisGrade: IrisGrade | null;
    irisTotal: number | null;
    createdAt: string | null;

    shippingCents: number | null;

    returnPolicy: string | null;

    warrantyDescription: string | null;

    variants: MarketplaceVariant[];

    sizeGuide: SizeMeasurement[];

    preparationDays: number;

    atelierPausedUntil: string | null;

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

export const MARKETPLACE_SORT_ORDER: readonly MarketplaceSort[] = [
    'relevance',
    'newest',
    'price-asc',
    'price-desc',
    'iris',
];

const GRADES: ReadonlySet<string> = new Set(['A', 'B', 'C', 'D', 'E']);

// Reconnaît les notes Iris autorisées.
function asGrade(value: string | null | undefined): IrisGrade | null {
    return value && GRADES.has(value) ? (value as IrisGrade) : null;
}

// Prépare le produit de la boutique avec ses valeurs de remplacement.
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

// Réunit la taille et la couleur renseignées de la déclinaison.
export function variantLabel(variant: MarketplaceVariant): string | null {
    const size = variant.sizeLabel?.trim();
    const color = variant.colorLabel?.trim();
    if (size && color) return `${size} · ${color}`;
    return size || color || null;
}

// Liste les tailles du produit sans doublon.
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

// Liste les couleurs du produit sans doublon.
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

// Cherche la déclinaison correspondant à la taille et à la couleur.
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

// Décrit le délai de préparation renseigné.
export function preparationLabel(days: number): string | null {
    return days >= 1 ? `Expédiée sous ${days} jour${days > 1 ? 's' : ''}` : null;
}
