import type { DraftLike, ValidateStepResult } from '@/features/wizard-shell/use-step-navigation';

export function validateStep(draft: DraftLike): ValidateStepResult {
    const missing: string[] = [];
    if (!draft.garment.name?.trim()) missing.push('Nom du modèle');
    if (!draft.garment.category) missing.push('Catégorie');
    if (!draft.garment.originCountry?.trim()) missing.push("Pays d'origine");
    return missing.length === 0 ? { ok: true } : { ok: false, missing };
}
