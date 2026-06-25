import type { WizardStep } from '@/lib/draft-store';
import { validateStep as validateProduct } from '@/features/create-step-product/schema';
import { validateStep as validateCare } from '@/features/create-step-care/schema';
import { validateStep as validateTraceability } from '@/features/create-step-traceability/schema';
import { validateStep as validateEco } from '@/features/create-step-eco/schema';
import type { DraftLike, ValidateStepResult } from './use-step-navigation';

export const STEP_VALIDATORS: Record<WizardStep, (d: DraftLike) => ValidateStepResult> = {
    product: validateProduct,
    care: validateCare,
    traceability: validateTraceability,
    eco: validateEco,
};
