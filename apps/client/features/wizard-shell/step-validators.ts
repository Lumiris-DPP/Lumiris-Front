import type { WizardStep } from '@/lib/draft-store';
import { validateStep as validateIdentification } from '@/features/create-step-identification/schema';
import { validateStep as validateComposition } from '@/features/create-step-composition/schema';
import { validateStep as validateInvoice } from '@/features/create-step-invoice-scan/schema';
import { validateStep as validateManufacturing } from '@/features/create-step-manufacturing/schema';
import { validateStep as validateCertifications } from '@/features/create-step-certifications/schema';
import { validateStep as validatePublish } from '@/features/create-step-publish/schema';
import type { DraftLike, ValidateStepResult } from './use-step-navigation';

export const STEP_VALIDATORS: Record<WizardStep, (d: DraftLike) => ValidateStepResult> = {
    identification: validateIdentification,
    composition: validateComposition,
    invoice: validateInvoice,
    manufacturing: validateManufacturing,
    certifications: validateCertifications,
    publish: validatePublish,
};
