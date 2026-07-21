'use client';

import { useEffect, useState } from 'react';
import { QrCode, Save } from 'lucide-react';
import type { EcoInfo } from '@lumiris/types';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Textarea } from '@lumiris/ui/components/textarea';
import { Switch } from '@lumiris/ui/components/switch';
import { Button } from '@lumiris/ui/components/button';
import { WizardStepFrame } from '@/features/wizard-shell/step-frame';
import { useStepNavigation } from '@/features/wizard-shell/use-step-navigation';
import { DocUploadField } from '@/features/wizard-shell/doc-upload-field';
import { useDraftStore } from '@/lib/draft-store';
import { useAuthStore } from '@/lib/auth-store';
import { useCreateDppForm, useUpdateDppForm, usePublishDppForm } from '@lumiris/api-client/react';
import { isApiError, dppFilesToParts } from '@lumiris/api-client';
import { toast } from '@lumiris/ui/components/sonner';
import { useRouter } from 'next/navigation';

export function CreateStepEco({ draftId }: { draftId: string }) {
    const draft = useDraftStore((s) => s.drafts[draftId]);
    const setEco = useDraftStore((s) => s.setEco);
    const setFile = useDraftStore((s) => s.setFile);
    const deleteDraft = useDraftStore((s) => s.deleteDraft);
    const token = useAuthStore((s) => s.token);
    const createDpp = useCreateDppForm();
    const updateDpp = useUpdateDppForm();
    const publishDpp = usePublishDppForm();
    const { goTo } = useStepNavigation(draftId);
    const router = useRouter();

    const [form, setForm] = useState<EcoInfo>(draft?.eco ?? {});
    const [publishing, setPublishing] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);
    const backendId = draft?.backendId;

    const [repairManualFile, setRepairManualFile] = useState<File | null>(
        () => draft?.files?.['REPAIR_MANUAL'] ?? null,
    );
    const [careGuideFile, setCareGuideFile] = useState<File | null>(() => draft?.files?.['CARE_GUIDE'] ?? null);
    const [endOfLifeFile, setEndOfLifeFile] = useState<File | null>(() => draft?.files?.['END_OF_LIFE_GUIDE'] ?? null);

    useEffect(() => {
        if (draft) setForm(draft.eco);
    }, [draft]);

    const handlePrev = () => {
        setEco(draftId, form);
        goTo('traceability');
    };

    const persistForm = () => {
        setEco(draftId, form);
        setFile(draftId, 'REPAIR_MANUAL', form.isRepairable ? repairManualFile : null);
        setFile(draftId, 'CARE_GUIDE', careGuideFile);
        setFile(draftId, 'END_OF_LIFE_GUIDE', endOfLifeFile);
    };

    const buildPayload = (d: NonNullable<typeof draft>) => ({
        productName: d.garment.name ?? null,
        productDescription: d.garment.description ?? null,
        productCategory: d.garment.category ?? null,
        originCountry: d.garment.originCountry ?? null,
        availableSizes: d.garment.availableSizes ?? null,
        colors: d.garment.colors ?? null,
        materials: d.materials.map((m) => ({
            fiber: m.fiber,
            percentage: m.percentage,
            originCountry: m.originCountry,
        })),
        careInstructions: d.careInstructions,
        careNotes: d.careNotes || null,
        manufacturedAt: d.traceability.manufacturedAt,
        batchNumber: d.traceability.batchNumber ?? null,
        quantity: draft?.traceability.quantity && draft.traceability.quantity >= 1 ? draft.traceability.quantity : 1,
        gtin: d.traceability.gtin ?? null,
        sku: d.traceability.sku ?? null,
        reachCompliant: d.traceability.reachCompliant,
        recycledPct: form.recycledPct ?? null,
        warrantyDescription: form.warrantyDescription ?? null,
        isRepairable: form.isRepairable ?? false,
        endOfLifeInstructions: form.endOfLifeInstructions ?? null,
    });

    // Draft files are keyed by backend DocumentType; the endpoints expect part names.
    const buildFiles = (d: NonNullable<typeof draft>) => {
        const files: Partial<Record<string, File>> = {
            ...d.files,
            ...(form.isRepairable && repairManualFile ? { REPAIR_MANUAL: repairManualFile } : {}),
            ...(careGuideFile ? { CARE_GUIDE: careGuideFile } : {}),
            ...(endOfLifeFile ? { END_OF_LIFE_GUIDE: endOfLifeFile } : {}),
        };
        if (!form.isRepairable) delete files['REPAIR_MANUAL'];
        return dppFilesToParts(files);
    };

    // "Enregistrer en brouillon": create a DRAFT (or update the one being edited), then back to list.
    const handleSaveDraft = async () => {
        if (!draft || !token) return;
        persistForm();
        setSavingDraft(true);
        const payload = buildPayload(draft);
        const files = buildFiles(draft);
        try {
            if (backendId) {
                await updateDpp.mutateAsync({ id: backendId, payload, files });
            } else {
                await createDpp.mutateAsync({ payload, files, draft: true });
            }
            deleteDraft(draftId);
            toast.success('Brouillon enregistré.');
            router.push('/passports');
        } catch {
            setSavingDraft(false);
            toast.error("L'enregistrement du brouillon a échoué. Réessayez.");
        }
    };

    // Final validation: publish. When editing a draft, push edits (PUT) then publish it.
    const handlePublish = async () => {
        if (!draft) return;
        persistForm();
        setPublishing(true);

        const payload = buildPayload(draft);
        const files = buildFiles(draft);

        try {
            if (!token) {
                deleteDraft(draftId);
                router.push('/passports');
                return;
            }
            let publishedId: string;
            if (backendId) {
                await updateDpp.mutateAsync({ id: backendId, payload, files });
                await publishDpp.mutateAsync(backendId);
                publishedId = backendId;
            } else {
                const created = await createDpp.mutateAsync({ payload, files });
                publishedId = created.id;
            }
            deleteDraft(draftId);
            router.push(`/passports/${publishedId}`);
        } catch (err) {
            setPublishing(false);
            if (isApiError(err) && (err.code === 'FORBIDDEN' || err.status === 403)) {
                toast.error('Quota atteint ou abonnement requis', {
                    description: 'Vérifiez votre abonnement avant de publier.',
                });
                router.push('/subscription');
            } else if (isApiError(err)) {
                // The backend returns a precise reason on a 400, e.g. "Passeport incomplet :
                // renseignez le nom du produit, …" — surface it (plus any field errors) instead
                // of a generic message so the artisan knows exactly what to fix.
                const fieldMessages = err.fields ? Object.values(err.fields).flat() : [];
                toast.error('La publication a échoué', {
                    description: fieldMessages.length > 0 ? fieldMessages.join(' · ') : err.message,
                });
            } else {
                toast.error('La publication a échoué. Réessayez.');
            }
        }
    };

    return (
        <WizardStepFrame draftId={draftId} step="eco" onPrev={handlePrev} hideNav contentClassName="space-y-6">
            <p className="text-muted-foreground text-sm">
                Ces champs sont optionnels mais valorisants pour votre score Iris et pour les consommateurs soucieux de
                l&apos;environnement.
            </p>

            {/* % matières recyclées */}
            <div className="space-y-2">
                <Label htmlFor="recycled">Part de matières recyclées (%)</Label>
                <div className="relative w-40">
                    <Input
                        id="recycled"
                        type="number"
                        min={0}
                        max={100}
                        value={form.recycledPct ?? ''}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, recycledPct: e.target.value ? Number(e.target.value) : undefined }))
                        }
                        className={`pr-8 ${(form.recycledPct ?? 0) > 100 ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                    <span className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 text-sm">%</span>
                </div>
                {(form.recycledPct ?? 0) > 100 && (
                    <p className="text-destructive text-xs">La valeur ne peut pas dépasser 100 %.</p>
                )}
            </div>

            {/* Durée de vie / Garantie */}
            <div className="space-y-2">
                <Label htmlFor="warranty">Durée de vie estimée ou garantie étendue</Label>
                <Input
                    id="warranty"
                    value={form.warrantyDescription ?? ''}
                    placeholder="2 ans, garantie à vie sur les coutures…"
                    onChange={(e) => setForm((f) => ({ ...f, warrantyDescription: e.target.value }))}
                />
            </div>

            {/* Réparabilité */}
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label htmlFor="repairable" className="cursor-pointer">
                        Facilement réparable
                    </Label>
                    <p className="text-muted-foreground text-[11px]">
                        Bouton d&apos;origine fourni, coutures accessibles, pièces détachées disponibles.
                    </p>
                </div>
                <Switch
                    id="repairable"
                    checked={form.isRepairable ?? false}
                    onCheckedChange={(v) => {
                        const updated = { ...form, isRepairable: v };
                        setForm(updated);
                        setEco(draftId, updated);
                        if (!v) {
                            setRepairManualFile(null);
                            setFile(draftId, 'REPAIR_MANUAL', null);
                        }
                    }}
                />
            </div>

            {form.isRepairable && (
                <DocUploadField
                    label="Manuel de Réparation Technique"
                    description="Un document à destination des couturiers ou des ateliers de réparation, expliquant comment changer une doublure, remplacer un point de broderie ou découdre un empiècement sans détruire le vêtement."
                    value={repairManualFile}
                    onChange={(file) => {
                        setRepairManualFile(file);
                        setFile(draftId, 'REPAIR_MANUAL', file);
                    }}
                />
            )}

            {/* Consignes de fin de vie */}
            <div className="space-y-2">
                <Label htmlFor="end-of-life">Consignes de fin de vie</Label>
                <Textarea
                    id="end-of-life"
                    value={form.endOfLifeInstructions ?? ''}
                    rows={3}
                    placeholder="Rapportez ce vêtement en boutique pour le programme de reprise…"
                    onChange={(e) => setForm((f) => ({ ...f, endOfLifeInstructions: e.target.value }))}
                />
            </div>

            {/* Documents éco */}
            <div className="border-border space-y-4 rounded-lg border p-4">
                <p className="text-sm font-medium">Documents de durabilité</p>

                <DocUploadField
                    label="Guide d'Entretien Avancé"
                    description="Au-delà des pictogrammes de lavage, un PDF illustré détaillant comment défroisser la matière, la stocker (à plat ou sur cintre spécifique) ou traiter une tâche spécifique sur ce tissu rare."
                    value={careGuideFile}
                    onChange={(file) => {
                        setCareGuideFile(file);
                        setFile(draftId, 'CARE_GUIDE', file);
                    }}
                />

                <DocUploadField
                    label="Instructions de Recyclage / Tri (End-of-Life Guide)"
                    description="Un document spécifiant si les fils de couture sont hydrosolubles, comment séparer les parties en métal (boutons, corsets) des parties textiles pour les centres de tri."
                    value={endOfLifeFile}
                    onChange={(file) => {
                        setEndOfLifeFile(file);
                        setFile(draftId, 'END_OF_LIFE_GUIDE', file);
                    }}
                />
            </div>

            {/* Boutons brouillon + publier */}
            <div className="border-border border-t pt-4">
                <div className="flex items-center justify-between gap-4">
                    <Button variant="outline" onClick={handlePrev} disabled={publishing || savingDraft}>
                        Précédent
                    </Button>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={handleSaveDraft}
                            disabled={publishing || savingDraft || (form.recycledPct ?? 0) > 100}
                            className="gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {savingDraft ? 'Enregistrement…' : 'Enregistrer en brouillon'}
                        </Button>
                        <Button
                            onClick={handlePublish}
                            disabled={publishing || savingDraft || (form.recycledPct ?? 0) > 100}
                            className="bg-lumiris-cyan hover:bg-lumiris-cyan/90 gap-2 text-white"
                        >
                            <QrCode className="h-4 w-4" />
                            {publishing ? 'Publication…' : 'Publier et générer le QR Code'}
                        </Button>
                    </div>
                </div>
            </div>
        </WizardStepFrame>
    );
}
