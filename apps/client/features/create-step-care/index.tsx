'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CareInstructionCode, DppCertification, DppMaterial } from '@lumiris/types';
import { Label } from '@lumiris/ui/components/label';
import { Textarea } from '@lumiris/ui/components/textarea';
import { WizardStepFrame } from '@/features/wizard-shell/step-frame';
import { useStepNavigation } from '@/features/wizard-shell/use-step-navigation';
import { useDraftStore } from '@/lib/draft-store';
import { draftToValidationInput } from '@/features/wizard-shell/validation-input';
import { validateStep } from './schema';
import { CareSymbolsSection, CertificationsSection, CompositionSection } from './sections';

export function CreateStepCare({ draftId }: { draftId: string }) {
    const draft = useDraftStore((s) => s.drafts[draftId]);
    const setMaterials = useDraftStore((s) => s.setMaterials);
    const setCareInstructions = useDraftStore((s) => s.setCareInstructions);
    const setCertifications = useDraftStore((s) => s.setCertifications);
    const setCareNotes = useDraftStore((s) => s.setCareNotes);
    const { goNext, goTo } = useStepNavigation(draftId);

    const [materials, setLocalMaterials] = useState<DppMaterial[]>(draft?.materials ?? []);
    const [care, setLocalCare] = useState<CareInstructionCode[]>(draft?.careInstructions ?? []);
    const [certs, setLocalCerts] = useState<DppCertification[]>(draft?.certifications ?? []);
    const [careNotes, setLocalCareNotes] = useState<string>(draft?.careNotes ?? '');

    useEffect(() => {
        if (draft) {
            setLocalMaterials(draft.materials);
            setLocalCare(draft.careInstructions);
            setLocalCerts(draft.certifications);
            setLocalCareNotes(draft.careNotes);
        }
    }, [draft]);

    const validation = useMemo(
        () => validateStep(draftToValidationInput(draft, { materials, careInstructions: care, certifications: certs })),
        [materials, care, certs, draft],
    );

    const persist = () => {
        setMaterials(draftId, materials);
        setCareInstructions(draftId, care);
        setCertifications(draftId, certs);
        setCareNotes(draftId, careNotes);
    };

    const handleNext = () => {
        persist();
        goNext('care', 'traceability');
    };

    const handlePrev = () => {
        persist();
        goTo('product');
    };

    const addMaterial = () => {
        setLocalMaterials((prev) => [...prev, { fiber: 'cotton', percentage: 0, originCountry: '' }]);
    };

    const removeMaterial = (i: number) => {
        setLocalMaterials((prev) => prev.filter((_, idx) => idx !== i));
    };

    const updateMaterial = (i: number, patch: Partial<DppMaterial>) => {
        setLocalMaterials((prev) => prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
    };

    const toggleCare = (code: CareInstructionCode) => {
        setLocalCare((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
    };

    const toggleCert = (name: DppCertification['name']) => {
        setLocalCerts((prev) => {
            const exists = prev.find((c) => c.name === name);
            return exists ? prev.filter((c) => c.name !== name) : [...prev, { name }];
        });
    };

    const updateCertLicense = (name: DppCertification['name'], licenseNumber: string) => {
        setLocalCerts((prev) => prev.map((c) => (c.name === name ? { ...c, licenseNumber } : c)));
    };

    return (
        <WizardStepFrame
            draftId={draftId}
            step="care"
            onPrev={handlePrev}
            onNext={handleNext}
            nextMissing={validation.ok ? [] : validation.missing}
            contentClassName="space-y-8"
        >
            <CompositionSection
                materials={materials}
                onAdd={addMaterial}
                onRemove={removeMaterial}
                onUpdate={updateMaterial}
            />
            <CareSymbolsSection care={care} onToggle={toggleCare} />
            <CertificationsSection certs={certs} onToggle={toggleCert} onUpdateLicense={updateCertLicense} />

            <section className="space-y-2">
                <Label htmlFor="care-notes" className="text-base font-semibold">
                    Notes d&apos;entretien
                </Label>
                <Textarea
                    id="care-notes"
                    value={careNotes}
                    rows={4}
                    placeholder="Conseils spécifiques d'entretien, précautions particulières, recommandations du fabricant…"
                    onChange={(e) => setLocalCareNotes(e.target.value)}
                />
            </section>
        </WizardStepFrame>
    );
}
