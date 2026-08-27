'use client';

import { useEffect, useMemo, useState } from 'react';
import type { TraceabilityInfo } from '@lumiris/types';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Checkbox } from '@lumiris/ui/components/checkbox';
import { WizardStepFrame } from '@/features/wizard-shell/step-frame';
import { useStepNavigation } from '@/features/wizard-shell/use-step-navigation';
import { DocUploadField } from '@/features/wizard-shell/doc-upload-field';
import { useDraftStore } from '@/lib/draft-store';
import { draftToValidationInput } from '@/features/wizard-shell/validation-input';
import { validateStep } from './schema';

export function CreateStepTraceability({ draftId }: { draftId: string }) {
    const draft = useDraftStore((s) => s.drafts[draftId]);
    const setTraceability = useDraftStore((s) => s.setTraceability);
    const setFile = useDraftStore((s) => s.setFile);
    const { goNext, goTo } = useStepNavigation(draftId);

    const [form, setForm] = useState<TraceabilityInfo>(
        draft?.traceability ?? {
            manufacturedAt: new Date().toISOString().slice(0, 10),
            reachCompliant: false,
        },
    );

    const [reachFile, setReachFile] = useState<File | null>(() => draft?.files?.['REACH_COMPLIANCE'] ?? null);
    const [euDeclarationFile, setEuDeclarationFile] = useState<File | null>(
        () => draft?.files?.['EU_DOC_OF_CONFORMITY'] ?? null,
    );
    const [testReportsFile, setTestReportsFile] = useState<File | null>(() => draft?.files?.['TEST_REPORTS'] ?? null);
    const [transactionCertsFile, setTransactionCertsFile] = useState<File | null>(
        () => draft?.files?.['TRANSACTION_CERTIFICATES'] ?? null,
    );
    const [originCertsFile, setOriginCertsFile] = useState<File | null>(
        () => draft?.files?.['ORIGIN_CERTIFICATES'] ?? null,
    );

    const persistedTraceability = draft?.traceability;
    useEffect(() => {
        if (persistedTraceability) setForm(persistedTraceability);
    }, [persistedTraceability]);

    const validation = useMemo(
        () => validateStep(draftToValidationInput(draft, { traceability: form })),
        [form, draft],
    );

    const saveFiles = () => {
        setFile(draftId, 'REACH_COMPLIANCE', form.reachCompliant ? reachFile : null);
        setFile(draftId, 'EU_DOC_OF_CONFORMITY', euDeclarationFile);
        setFile(draftId, 'TEST_REPORTS', testReportsFile);
        setFile(draftId, 'TRANSACTION_CERTIFICATES', transactionCertsFile);
        setFile(draftId, 'ORIGIN_CERTIFICATES', originCertsFile);
    };

    const handleNext = () => {
        setTraceability(draftId, form);
        saveFiles();
        goNext('traceability', 'eco');
    };

    const handlePrev = () => {
        setTraceability(draftId, form);
        saveFiles();
        goTo('care');
    };

    const handleReachChange = (checked: boolean) => {
        const updated = { ...form, reachCompliant: checked };
        setForm(updated);
        setTraceability(draftId, updated);
        if (!checked) {
            setReachFile(null);
            setFile(draftId, 'REACH_COMPLIANCE', null);
        }
    };

    return (
        <WizardStepFrame
            draftId={draftId}
            step="traceability"
            onPrev={handlePrev}
            onNext={handleNext}
            nextMissing={validation.ok ? [] : validation.missing}
            contentClassName="grid gap-5 md:grid-cols-2"
        >
            {/* Date de fabrication */}
            <div className="space-y-2">
                <Label htmlFor="manufactured-at">Date de fabrication</Label>
                <Input
                    id="manufactured-at"
                    type="date"
                    value={form.manufacturedAt}
                    onChange={(e) => setForm((f) => ({ ...f, manufacturedAt: e.target.value }))}
                />
            </div>

            {/* Numéro de lot */}
            <div className="space-y-2">
                <Label htmlFor="batch">Numéro de lot (Batch)</Label>
                <Input
                    id="batch"
                    value={form.batchNumber ?? ''}
                    placeholder="LOT-2026-001"
                    onChange={(e) => setForm((f) => ({ ...f, batchNumber: e.target.value }))}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="quantity">Nombre d&apos;exemplaires produits</Label>
                <Input
                    id="quantity"
                    type="number"
                    min={1}
                    className="w-40"
                    value={form.quantity ?? 1}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: Math.max(1, Number(e.target.value) || 1) }))}
                />
                <p className="text-[11px] text-muted-foreground">
                    Combien de pièces pour ce passeport. Sert de stock initial si vous convertissez ce DPP en produit.
                </p>
            </div>

            {/* GTIN / EAN */}
            <div className="space-y-2">
                <Label htmlFor="gtin">GTIN / EAN (code-barres)</Label>
                <Input
                    id="gtin"
                    value={form.gtin ?? ''}
                    placeholder="1234567890123"
                    maxLength={14}
                    onChange={(e) => setForm((f) => ({ ...f, gtin: e.target.value }))}
                />
            </div>

            {/* SKU */}
            <div className="space-y-2">
                <Label htmlFor="sku">SKU (référence interne)</Label>
                <Input
                    id="sku"
                    value={form.sku ?? ''}
                    placeholder="SKU-001"
                    onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                />
            </div>

            {/* Conformité REACH */}
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4 md:col-span-2">
                <div className="flex items-start gap-3">
                    <Checkbox
                        id="reach"
                        checked={form.reachCompliant}
                        onCheckedChange={(v) => handleReachChange(v === true)}
                        className="mt-0.5"
                    />
                    <div className="space-y-1">
                        <label htmlFor="reach" className="cursor-pointer text-sm leading-snug font-medium">
                            Je certifie que ce produit respecte les réglementations européennes REACH (absence de
                            colorants azoïques interdits et substances toxiques).{' '}
                            <span className="text-destructive">*</span>
                        </label>
                        <p className="text-[11px] text-muted-foreground">
                            Obligatoire pour vendre en Europe. Vos fournisseurs de tissus doivent vous fournir cette
                            garantie.
                        </p>
                    </div>
                </div>

                {form.reachCompliant && (
                    <DocUploadField
                        label="Fiches de Conformité Chimique (REACH / OEKO-TEX)"
                        description="Les documents PDF prouvant l'absence de substances interdites ou dangereuses (colorants azoïques, métaux lourds dans les boutons/zips)."
                        value={reachFile}
                        onChange={(file) => {
                            setReachFile(file);
                            setFile(draftId, 'REACH_COMPLIANCE', file);
                        }}
                        existing={draft?.existingDocs?.['REACH_COMPLIANCE']}
                    />
                )}
            </div>

            {/* Documents techniques */}
            <div className="space-y-4 rounded-lg border border-border p-4 md:col-span-2">
                <p className="text-sm font-medium">Documents de conformité & traçabilité</p>

                <DocUploadField
                    label="Déclaration UE de Conformité (DoC)"
                    description="Le document officiel attestant que le vêtement respecte les normes européennes."
                    advisory="Obligation légale"
                    value={euDeclarationFile}
                    onChange={(file) => {
                        setEuDeclarationFile(file);
                        setFile(draftId, 'EU_DOC_OF_CONFORMITY', file);
                    }}
                    existing={draft?.existingDocs?.['EU_DOC_OF_CONFORMITY']}
                />

                <DocUploadField
                    label="Rapports de Tests d'Atelier / Laboratoire"
                    description="Les certificats de tests physiques ou mécaniques (tests de résistance à la traction, boulochage, stabilité dimensionnelle selon les normes ISO)."
                    value={testReportsFile}
                    onChange={(file) => {
                        setTestReportsFile(file);
                        setFile(draftId, 'TEST_REPORTS', file);
                    }}
                    existing={draft?.existingDocs?.['TEST_REPORTS']}
                />

                <DocUploadField
                    label="Certificats de Transaction (TC)"
                    description="Délivrés par des organismes comme GOTS ou RWS. Ils prouvent l'origine de la fibre depuis la ferme jusqu'à votre atelier."
                    value={transactionCertsFile}
                    onChange={(file) => {
                        setTransactionCertsFile(file);
                        setFile(draftId, 'TRANSACTION_CERTIFICATES', file);
                    }}
                    existing={draft?.existingDocs?.['TRANSACTION_CERTIFICATES']}
                />

                <DocUploadField
                    label="Certificats d'Origine Géographique"
                    description="Pour la haute couture ou l'artisanat : labels officiels comme l'Indication Géographique Protégée (ex : Dentelle de Calais-Caudry) ou Appellation d'Origine."
                    value={originCertsFile}
                    onChange={(file) => {
                        setOriginCertsFile(file);
                        setFile(draftId, 'ORIGIN_CERTIFICATES', file);
                    }}
                    existing={draft?.existingDocs?.['ORIGIN_CERTIFICATES']}
                />
            </div>
        </WizardStepFrame>
    );
}
