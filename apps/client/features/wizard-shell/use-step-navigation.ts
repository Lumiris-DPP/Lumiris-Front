'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import type { GarmentInfo, Material, ProductionStep, PassportWarranty, CertificationRef } from '@lumiris/types';
import { useDraftStore, type WizardStep } from '@/lib/draft-store';

export interface DraftLike {
    garment: GarmentInfo;
    materials: readonly Material[];
    steps: readonly ProductionStep[];
    certifications: readonly CertificationRef[];
    warranty: PassportWarranty;
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
