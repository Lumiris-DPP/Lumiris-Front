'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import type { GarmentInfo, GarmentKind } from '@lumiris/types';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { WizardStepFrame } from '@/features/wizard-shell/step-frame';
import { useStepNavigation } from '@/features/wizard-shell/use-step-navigation';
import { useDraftStore } from '@/lib/draft-store';
import { useAuthStore } from '@/lib/auth-store';
import { patchDppForm } from '@/lib/dpp-api';
import { readFileAsDataUrl } from '@lumiris/utils';
import { validateStep } from './schema';

const PRODUCT_KINDS: ReadonlyArray<{ value: GarmentKind; label: string }> = [
    { value: 'sweater', label: 'Pull' },
    { value: 'shirt', label: 'Chemise' },
    { value: 'shoe', label: 'Chaussure' },
    { value: 'jacket', label: 'Veste' },
    { value: 'trouser', label: 'Pantalon' },
    { value: 'accessory', label: 'Accessoire' },
    { value: 'other', label: 'Autre' },
];

export function CreateStepIdentification({ draftId }: { draftId: string }) {
    const draft = useDraftStore((s) => s.drafts[draftId]);
    const setGarment = useDraftStore((s) => s.setGarment);
    const token = useAuthStore((s) => s.token);
    const { goNext } = useStepNavigation(draftId);

    const [form, setForm] = useState<GarmentInfo>(
        draft?.garment ?? {
            kind: 'sweater',
            name: '',
            reference: '',
            mainPhotoUrl: '',
            dimensions: {},
            retailPrice: 0,
            currency: 'EUR',
        },
    );

    useEffect(() => {
        if (draft) setForm(draft.garment);
    }, [draft]);

    const validation = useMemo(
        () =>
            validateStep({
                garment: form,
                materials: draft?.materials ?? [],
                steps: draft?.steps ?? [],
                certifications: draft?.certifications ?? [],
                warranty: draft?.warranty ?? { durationMonths: 0, terms: '' },
            }),
        [form, draft],
    );
    const nextMissing = validation.ok ? [] : validation.missing;

    const handleNext = () => {
        setGarment(draftId, form);

        if (token) {
            void patchDppForm(token, draftId, {
                productName: form.name ?? null,
                productType: form.kind,
                internalReference: form.reference || null,
                retailPrice: form.retailPrice > 0 ? form.retailPrice : null,
                currency: form.currency,
            }).catch(() => {});
        }

        goNext('identification', 'composition');
    };

    const handlePhoto = async (file: File | undefined) => {
        if (!file) return;
        const dataUrl = await readFileAsDataUrl(file);
        setForm((f) => ({ ...f, mainPhotoUrl: dataUrl }));
    };

    return (
        <WizardStepFrame
            draftId={draftId}
            step="identification"
            onNext={handleNext}
            nextMissing={nextMissing}
            contentClassName="grid gap-4 md:grid-cols-2"
        >
            <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Nom du produit</Label>
                <Input
                    id="name"
                    value={form.name ?? ''}
                    maxLength={255}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Pull Merino Col Roulé"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="kind">Type produit</Label>
                <Select value={form.kind} onValueChange={(v) => setForm((f) => ({ ...f, kind: v as GarmentKind }))}>
                    <SelectTrigger id="kind">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {PRODUCT_KINDS.map((k) => (
                            <SelectItem key={k.value} value={k.value}>
                                {k.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="reference">Référence interne</Label>
                <Input
                    id="reference"
                    value={form.reference}
                    maxLength={60}
                    onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                    placeholder="CHE-2026-001"
                />
            </div>

            <div className="space-y-2 md:col-span-2">
                <Label>Photo principale</Label>
                <label className="border-border bg-muted/40 hover:bg-muted relative flex h-44 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition-colors">
                    {form.mainPhotoUrl ? (
                        <Image
                            src={form.mainPhotoUrl}
                            alt="Visuel principal en cours d'import"
                            fill
                            sizes="(min-width: 768px) 50vw, 100vw"
                            unoptimized
                            className="rounded-xl object-cover"
                        />
                    ) : (
                        <>
                            <ImagePlus className="text-muted-foreground mb-2 h-6 w-6" />
                            <p className="text-muted-foreground text-sm">Glissez ou cliquez pour ajouter une photo</p>
                        </>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        aria-label="Importer la photo principale du produit"
                        className="absolute inset-0 cursor-pointer opacity-0"
                        onChange={(e) => handlePhoto(e.target.files?.[0])}
                    />
                </label>
            </div>

            <div className="space-y-2">
                <Label htmlFor="length">Longueur (cm)</Label>
                <Input
                    id="length"
                    type="number"
                    min={0}
                    value={form.dimensions.length ?? ''}
                    onChange={(e) =>
                        setForm((f) => ({
                            ...f,
                            dimensions: { ...f.dimensions, length: numOrUndef(e.target.value) },
                        }))
                    }
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="width">Largeur (cm)</Label>
                <Input
                    id="width"
                    type="number"
                    min={0}
                    value={form.dimensions.width ?? ''}
                    onChange={(e) =>
                        setForm((f) => ({
                            ...f,
                            dimensions: { ...f.dimensions, width: numOrUndef(e.target.value) },
                        }))
                    }
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="height">Hauteur (cm)</Label>
                <Input
                    id="height"
                    type="number"
                    min={0}
                    value={form.dimensions.height ?? ''}
                    onChange={(e) =>
                        setForm((f) => ({
                            ...f,
                            dimensions: { ...f.dimensions, height: numOrUndef(e.target.value) },
                        }))
                    }
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="weight">Poids (g)</Label>
                <Input
                    id="weight"
                    type="number"
                    min={0}
                    value={form.dimensions.weightG ?? ''}
                    onChange={(e) =>
                        setForm((f) => ({
                            ...f,
                            dimensions: { ...f.dimensions, weightG: numOrUndef(e.target.value) },
                        }))
                    }
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="price">Prix de vente</Label>
                <div className="relative">
                    <Input
                        id="price"
                        type="number"
                        min={0}
                        value={form.retailPrice || ''}
                        onChange={(e) => setForm((f) => ({ ...f, retailPrice: Number(e.target.value) || 0 }))}
                    />
                    <span className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 text-sm">€</span>
                </div>
            </div>
        </WizardStepFrame>
    );
}

function numOrUndef(v: string): number | undefined {
    if (v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}
