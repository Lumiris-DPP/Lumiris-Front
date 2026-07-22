import type { CareInstructionCode, Fiber, GarmentCategory, GarmentKind, StageKind } from '@lumiris/types';

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

export interface CareSymbol {
    code: CareInstructionCode;
    label: string;
    /** Pictogramme GINETEX servi depuis le `public/ginetex` de chaque app. */
    svgPath: string;
}

/** Codes d'entretien → libellé FR + pictogramme GINETEX. Source unique pour toutes les apps. */
export const CARE_SYMBOLS: readonly CareSymbol[] = [
    { code: 'wash-30', label: 'Lavage 30°', svgPath: '/ginetex/ginetex--30c-fine-wash.svg' },
    { code: 'wash-40', label: 'Lavage 40°', svgPath: '/ginetex/ginetex--40c-mild-wash.svg' },
    { code: 'wash-60', label: 'Lavage 60°', svgPath: '/ginetex/ginetex--60c-coloured-wash.svg' },
    { code: 'no-wash', label: 'Ne pas laver', svgPath: '/ginetex/ginetex--do-not-wash.svg' },
    { code: 'dry-clean', label: 'Nettoyage à sec', svgPath: '/ginetex/ginetex--dry-cleaning.svg' },
    { code: 'no-dry-clean', label: 'Pas de nettoyage à sec', svgPath: '/ginetex/ginetex--do-not-dry-clean.svg' },
    { code: 'tumble-dry', label: 'Sèche-linge autorisé', svgPath: '/ginetex/ginetex--tumble-drying.svg' },
    { code: 'no-tumble', label: 'Pas de sèche-linge', svgPath: '/ginetex/ginetex--tumble-drying-1.svg' },
    { code: 'iron-low', label: 'Repassage doux', svgPath: '/ginetex/ginetex--iron-at-low-temperature.svg' },
    { code: 'iron-med', label: 'Repassage moyen', svgPath: '/ginetex/ginetex--iron-at-moderate-temperature.svg' },
    { code: 'iron-high', label: 'Repassage fort', svgPath: '/ginetex/ginetex--hot-iron.svg' },
    { code: 'no-iron', label: 'Ne pas repasser', svgPath: '/ginetex/ginetex--do-not-iron.svg' },
];

const CARE_SYMBOL_BY_CODE = new Map<string, CareSymbol>(CARE_SYMBOLS.map((s) => [s.code, s]));

/** Résout un code d'entretien issu de l'API (chaîne libre) ; `undefined` si inconnu. */
export function careSymbol(code: string): CareSymbol | undefined {
    return CARE_SYMBOL_BY_CODE.get(code);
}

const CATEGORY_BY_VALUE = new Map<string, string>(Object.entries(GARMENT_CATEGORY_LABEL));

/** Résout le libellé d'une catégorie issue de l'API (chaîne libre), avec repli sur la valeur brute puis « — ». */
export function garmentCategoryLabel(value: string | null | undefined): string {
    if (!value) return '—';
    return CATEGORY_BY_VALUE.get(value) ?? value;
}

const FIBER_BY_VALUE = new Map<string, string>(Object.entries(FIBER_LABEL));

/** Résout le libellé d'une fibre issue de l'API (chaîne libre), avec repli sur la valeur brute puis « — ». */
export function fiberLabel(value: string | null | undefined): string {
    if (!value) return '—';
    return FIBER_BY_VALUE.get(value) ?? value;
}

const KIND_BY_VALUE = new Map<string, string>(Object.entries(GARMENT_KIND_LABEL));

/** Résout le libellé d'un type de vêtement issu de l'API (chaîne libre), avec repli sur la valeur brute puis « — ». */
export function garmentKindLabel(value: string | null | undefined): string {
    if (!value) return '—';
    return KIND_BY_VALUE.get(value) ?? value;
}
