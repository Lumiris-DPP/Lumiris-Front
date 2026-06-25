import type { DraftLike, ValidateStepResult } from '@/features/wizard-shell/use-step-navigation';

export function validateStep(draft: DraftLike): ValidateStepResult {
    if (draft.materials.length === 0) {
        return { ok: false, missing: ['Au moins une fibre'] };
    }
    const total = draft.materials.reduce((sum, m) => sum + m.percentage, 0);
    if (total !== 100) {
        return { ok: false, missing: [`Composition (${total}% / 100%)`] };
    }
    return { ok: true };
}
