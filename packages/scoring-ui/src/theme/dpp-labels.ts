import type { Fiber, GarmentCategory, GarmentKind, StageKind } from '@lumiris/types';

/** Libellés FR des fibres textiles. */
export const FIBER_LABEL: Record<Fiber, string> = {
    wool: 'Laine',
    linen: 'Lin',
    cotton: 'Coton',
    silk: 'Soie',
    hemp: 'Chanvre',
    leather: 'Cuir',
    cashmere: 'Cachemire',
    'recycled-polyester': 'Polyester recyclé',
    other: 'Autre',
};

/** Libellés FR des types de vêtement. */
export const GARMENT_KIND_LABEL: Record<GarmentKind, string> = {
    sweater: 'Pull',
    shirt: 'Chemise',
    shoe: 'Chaussures',
    jacket: 'Veste',
    trouser: 'Pantalon',
    accessory: 'Accessoire',
    other: 'Pièce',
};

/** Libellés FR des étapes de fabrication. */
export const STAGE_LABEL: Record<StageKind, string> = {
    weaving: 'Tissage',
    dyeing: 'Teinture',
    cutting: 'Coupe',
    sewing: 'Couture',
    finishing: 'Finition',
    embroidery: 'Broderie',
    assembly: 'Assemblage',
    'quality-check': 'Contrôle qualité',
    other: 'Étape',
};

/** Libellés FR des catégories de vêtement. */
export const GARMENT_CATEGORY_LABEL: Record<GarmentCategory, string> = {
    top: 'Haut',
    bottom: 'Bas',
    dress: 'Robe',
    outerwear: 'Manteau',
    shoe: 'Chaussure',
    accessory: 'Accessoire',
    other: 'Autre',
};

const CATEGORY_BY_VALUE = new Map<string, string>(Object.entries(GARMENT_CATEGORY_LABEL));

/** Résout le libellé d'une catégorie issue de l'API (chaîne libre), avec repli sur la valeur brute puis « — ». */
export function garmentCategoryLabel(value: string | null | undefined): string {
    if (!value) return '—';
    return CATEGORY_BY_VALUE.get(value) ?? value;
}
