import type { DraftLike, ValidateStepResult } from '@/features/wizard-shell/use-step-navigation';

export function validateStep(_draft: DraftLike): ValidateStepResult {
    return { ok: true };
}
