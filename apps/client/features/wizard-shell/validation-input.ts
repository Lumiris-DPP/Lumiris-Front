import type { DraftPassport } from '@/lib/draft-store';
import type { DraftLike } from './use-step-navigation';

const EMPTY_DRAFT: DraftLike = {
    garment: { kind: 'sweater', reference: '', mainPhotoUrl: '', dimensions: {}, retailPrice: 0, currency: 'EUR' },
    materials: [],
    careInstructions: [],
    certifications: [],
    traceability: { manufacturedAt: '', reachCompliant: false },
    eco: {},
};

/**
 * Builds the full draft shape `validateStep` expects: every slice the current
 * step doesn't own is taken from the saved draft (or empty defaults), and the
 * step's own slice(s) are overridden by its live local state via `patch`.
 *
 * Centralises the default scaffolding that every wizard step would otherwise
 * repeat inline.
 */
export function draftToValidationInput(draft: DraftPassport | undefined, patch: Partial<DraftLike>): DraftLike {
    return {
        garment: draft?.garment ?? EMPTY_DRAFT.garment,
        materials: draft?.materials ?? EMPTY_DRAFT.materials,
        careInstructions: draft?.careInstructions ?? EMPTY_DRAFT.careInstructions,
        certifications: draft?.certifications ?? EMPTY_DRAFT.certifications,
        traceability: draft?.traceability ?? EMPTY_DRAFT.traceability,
        eco: draft?.eco ?? EMPTY_DRAFT.eco,
        ...patch,
    };
}
