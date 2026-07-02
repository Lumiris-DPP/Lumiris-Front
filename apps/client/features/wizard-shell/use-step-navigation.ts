'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import type {
    GarmentInfo,
    DppMaterial,
    CareInstructionCode,
    TraceabilityInfo,
    EcoInfo,
} from '@lumiris/types';
import { useDraftStore, type WizardStep } from '@/lib/draft-store';

export interface DraftLike {
    garment: GarmentInfo;
    materials: readonly DppMaterial[];
    careInstructions: readonly CareInstructionCode[];
    careNotes: string;
    traceability: TraceabilityInfo;
    eco: EcoInfo;
}

export type ValidateStepResult = { ok: true } | { ok: false; missing: string[] };

export function useStepNavigation(draftId: string) {
    const router = useRouter();
    const setLastStep = useDraftStore((s) => s.setLastStep);

    const goNext = useCallback(
        (from: WizardStep, to: WizardStep) => {
            setLastStep(draftId, from);
            router.push(`/create/${draftId}/${to}`);
        },
        [draftId, router, setLastStep],
    );

    const goTo = useCallback(
        (to: WizardStep) => {
            router.push(`/create/${draftId}/${to}`);
        },
        [draftId, router],
    );

    return { goNext, goTo };
}
