import type { ProductionStep } from '@lumiris/types';

interface StepTemplate {
    label: string;
    kind: ProductionStep['kind'];
    photoCount: number;
}

export const PULL_LIN_STEPS: readonly StepTemplate[] = [
    { kind: 'weaving', label: 'Tissage du lin', photoCount: 2 },
    { kind: 'cutting', label: 'Coupe des panneaux', photoCount: 1 },
    { kind: 'sewing', label: 'Couture corps & manches', photoCount: 2 },
    { kind: 'finishing', label: 'Finitions main', photoCount: 1 },
    { kind: 'quality-check', label: 'Contrôle qualité', photoCount: 1 },
];

export const CHEMISE_LIN_STEPS: readonly StepTemplate[] = [
    { kind: 'weaving', label: 'Tissage de la toile', photoCount: 2 },
    { kind: 'cutting', label: 'Coupe au patron', photoCount: 1 },
    { kind: 'sewing', label: 'Assemblage chemise', photoCount: 2 },
    { kind: 'embroidery', label: 'Initiales brodées main', photoCount: 1 },
    { kind: 'finishing', label: 'Repassage & ourlets', photoCount: 0 },
    { kind: 'quality-check', label: 'Contrôle final', photoCount: 1 },
];

export const CHAUSSURE_CUIR_STEPS: readonly StepTemplate[] = [
    { kind: 'cutting', label: 'Découpe du cuir', photoCount: 2 },
    { kind: 'sewing', label: 'Couture tige et doublure', photoCount: 2 },
    { kind: 'assembly', label: 'Montage et clouage', photoCount: 2 },
    { kind: 'finishing', label: 'Cirage et finitions', photoCount: 1 },
    { kind: 'quality-check', label: 'Contrôle qualité', photoCount: 1 },
];

export function instantiateSteps(
    templates: readonly StepTemplate[],
    opts: { idPrefix: string; performedBy: string; locationCity: string; locationCountry?: string },
): ProductionStep[] {
    const country = opts.locationCountry ?? 'FR';
    return templates.map((t, idx) => ({
        id: `${opts.idPrefix}-step-${idx + 1}`,
        kind: t.kind,
        label: t.label,
        performedBy: opts.performedBy,
        locationCity: opts.locationCity,
        locationCountry: country,
        photos: Array.from(
            { length: t.photoCount },
            (_, i) => `https://placehold.co/640x480/png?text=${encodeURIComponent(t.label)}-${i + 1}`,
        ),
        performedAt: '2026-02-01T08:00:00Z',
    }));
}
