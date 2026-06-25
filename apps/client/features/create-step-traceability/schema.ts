import type { DraftLike, ValidateStepResult } from '@/features/wizard-shell/use-step-navigation';

export function validateStep(draft: DraftLike): ValidateStepResult {
    if (!draft.traceability.reachCompliant) {
        return { ok: false, missing: ['Conformité REACH obligatoire'] };
    }
    return { ok: true };
}
