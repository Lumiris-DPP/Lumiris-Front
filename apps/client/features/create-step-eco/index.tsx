'use client';

import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
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
import { submitDppForm } from '@/lib/dpp-api';
import { useRouter } from 'next/navigation';

export function CreateStepEco({ draftId }: { draftId: string }) {
    const draft = useDraftStore((s) => s.drafts[draftId]);
    const setEco = useDraftStore((s) => s.setEco);
    const setFile = useDraftStore((s) => s.setFile);
    const deleteDraft = useDraftStore((s) => s.deleteDraft);
    const token = useAuthStore((s) => s.token);
    const { goTo } = useStepNavigation(draftId);
    const router = useRouter();

    const [form, setForm] = useState<EcoInfo>(draft?.eco ?? {});
    const [publishing, setPublishing] = useState(false);

    const [repairManualFile, setRepairManualFile] = useState<File | null>(
        () => draft?.files?.['REPAIR_MANUAL'] ?? null,
    );
    const [careGuideFile, setCareGuideFile] = useState<File | null>(() => draft?.files?.['CARE_GUIDE'] ?? null);
    const [endOfLifeFile, setEndOfLifeFile] = useState<File | null>(() => draft?.files?.['END_OF_LIFE_GUIDE'] ?? null);

    useEffect(() => {
        if (draft) setForm(draft.eco);
    }, [draft?.eco]);

    const handlePrev = () => {
        setEco(draftId, form);
        goTo('traceability');
    };

    const handlePublish = async () => {
        if (!draft) return;
        setEco(draftId, form);
        setFile(draftId, 'REPAIR_MANUAL', form.isRepairable ? repairManualFile : null);
        setFile(draftId, 'CARE_GUIDE', careGuideFile);
        setFile(draftId, 'END_OF_LIFE_GUIDE', endOfLifeFile);
        setPublishing(true);

        const payload = {
            productName: draft.garment.name ?? null,
            productDescription: draft.garment.description ?? null,
            productCategory: draft.garment.category ?? null,
            originCountry: draft.garment.originCountry ?? null,
            availableSizes: draft.garment.availableSizes ?? null,
            colors: draft.garment.colors ?? null,
            materials: draft.materials.map((m) => ({
                fiber: m.fiber,
                percentage: m.percentage,
                originCountry: m.originCountry,
            })),
            careInstructions: draft.careInstructions,
            careNotes: draft.careNotes || null,
            manufacturedAt: draft.traceability.manufacturedAt,
            batchNumber: draft.traceability.batchNumber ?? null,
            gtin: draft.traceability.gtin ?? null,
            sku: draft.traceability.sku ?? null,
            reachCompliant: draft.traceability.reachCompliant,
            recycledPct: form.recycledPct ?? null,
            warrantyDescription: form.warrantyDescription ?? null,
            isRepairable: form.isRepairable ?? false,
            endOfLifeInstructions: form.endOfLifeInstructions ?? null,
        };

        const files: Partial<Record<string, File>> = {
            ...draft.files,
            ...(form.isRepairable && repairManualFile ? { REPAIR_MANUAL: repairManualFile } : {}),
            ...(careGuideFile ? { CARE_GUIDE: careGuideFile } : {}),
            ...(endOfLifeFile ? { END_OF_LIFE_GUIDE: endOfLifeFile } : {}),
        };
        if (!form.isRepairable) delete files['REPAIR_MANUAL'];

        try {
            if (token) {
                const created = await submitDppForm(token, payload, files);
                deleteDraft(draftId);
                router.push(`/passports/${created.id}`);
            }
        } catch {
            setPublishing(false);
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

            {/* Bouton publier */}
            <div className="border-border border-t pt-4">
                <div className="flex items-center justify-between gap-4">
                    <Button variant="outline" onClick={handlePrev}>
                        Précédent
                    </Button>
                    <Button
                        onClick={handlePublish}
                        disabled={publishing || (form.recycledPct ?? 0) > 100}
                        className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 gap-2 text-white"
                    >
                        <Send className="h-4 w-4" />
                        {publishing ? 'Publication…' : 'Publier le passeport'}
                    </Button>
                </div>
            </div>
        </WizardStepFrame>
    );
}
