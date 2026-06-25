'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import type { GarmentInfo, GarmentCategory } from '@lumiris/types';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Textarea } from '@lumiris/ui/components/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { Badge } from '@lumiris/ui/components/badge';
import { WizardStepFrame } from '@/features/wizard-shell/step-frame';
import { useStepNavigation } from '@/features/wizard-shell/use-step-navigation';
import { useDraftStore } from '@/lib/draft-store';
import { readFileAsDataUrl } from '@lumiris/utils';
import { validateStep } from './schema';

const CATEGORIES: ReadonlyArray<{ value: GarmentCategory; label: string }> = [
    { value: 'top', label: 'Haut (t-shirt, pull, chemise…)' },
    { value: 'bottom', label: 'Bas (pantalon, jupe, short…)' },
    { value: 'dress', label: 'Robe / Combinaison' },
    { value: 'outerwear', label: 'Veste / Manteau' },
    { value: 'shoe', label: 'Chaussure' },
    { value: 'accessory', label: 'Accessoire' },
    { value: 'other', label: 'Autre' },
];

const SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Unique'];

export function CreateStepProduct({ draftId }: { draftId: string }) {
    const draft = useDraftStore((s) => s.drafts[draftId]);
    const setGarment = useDraftStore((s) => s.setGarment);
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
    const [colorInput, setColorInput] = useState('');

    useEffect(() => {
        if (draft) setForm(draft.garment);
    }, [draft]);

    const validation = useMemo(
        () =>
            validateStep({
                garment: form,
                materials: draft?.materials ?? [],
                careInstructions: draft?.careInstructions ?? [],
                certifications: draft?.certifications ?? [],
                traceability: draft?.traceability ?? { manufacturedAt: '', reachCompliant: false },
                eco: draft?.eco ?? {},
            }),
        [form, draft],
    );

    const handleNext = () => {
        setGarment(draftId, form);
        goNext('product', 'care');
    };

    const handlePhoto = async (file: File | undefined) => {
        if (!file) return;
        const dataUrl = await readFileAsDataUrl(file);
        setForm((f) => ({ ...f, mainPhotoUrl: dataUrl }));
    };

    const toggleSize = (size: string) => {
        const current = form.availableSizes ?? [];
        setForm((f) => ({
            ...f,
            availableSizes: current.includes(size) ? current.filter((s) => s !== size) : [...current, size],
        }));
    };

    const addColor = () => {
        const trimmed = colorInput.trim();
        if (!trimmed) return;
        const current = form.colors ?? [];
        if (!current.includes(trimmed)) {
            setForm((f) => ({ ...f, colors: [...current, trimmed] }));
        }
        setColorInput('');
    };

    const removeColor = (color: string) => {
        setForm((f) => ({ ...f, colors: (f.colors ?? []).filter((c) => c !== color) }));
    };

    return (
        <WizardStepFrame
            draftId={draftId}
            step="product"
            onNext={handleNext}
            nextMissing={validation.ok ? [] : validation.missing}
            contentClassName="grid gap-5 md:grid-cols-2"
        >
            {/* Nom du modèle */}
            <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">
                    Nom du modèle <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="name"
                    value={form.name ?? ''}
                    maxLength={255}
                    placeholder="T-shirt Iconique"
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
            </div>

            {/* Description commerciale */}
            <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description commerciale</Label>
                <Textarea
                    id="description"
                    value={form.description ?? ''}
                    maxLength={500}
                    rows={3}
                    placeholder="Un t-shirt intemporel en coton bio, coupe droite…"
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
            </div>

            {/* Catégorie */}
            <div className="space-y-2">
                <Label htmlFor="category">
                    Catégorie <span className="text-destructive">*</span>
                </Label>
                <Select
                    value={form.category ?? ''}
                    onValueChange={(v) => setForm((f) => ({ ...f, category: v as GarmentCategory }))}
                >
                    <SelectTrigger id="category">
                        <SelectValue placeholder="Sélectionner…" />
                    </SelectTrigger>
                    <SelectContent>
                        {CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                                {c.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Pays d'origine */}
            <div className="space-y-2">
                <Label htmlFor="origin">
                    Pays d'origine <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="origin"
                    value={form.originCountry ?? ''}
                    maxLength={60}
                    placeholder="France, Portugal, Inde…"
                    onChange={(e) => setForm((f) => ({ ...f, originCountry: e.target.value }))}
                />
                <p className="text-muted-foreground text-[11px]">
                    Pays où a lieu la dernière transformation majeure (coupe & couture).
                </p>
            </div>

            {/* Photo principale */}
            <div className="space-y-2 md:col-span-2">
                <Label>Photo principale</Label>
                <label className="border-border bg-muted/40 hover:bg-muted relative flex h-44 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition-colors">
                    {form.mainPhotoUrl ? (
                        <Image
                            src={form.mainPhotoUrl}
                            alt="Visuel principal"
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

            {/* Tailles disponibles */}
            <div className="space-y-2 md:col-span-2">
                <Label>Tailles disponibles</Label>
                <div className="flex flex-wrap gap-2">
                    {SIZES.map((size) => {
                        const selected = (form.availableSizes ?? []).includes(size);
                        return (
                            <button
                                key={size}
                                type="button"
                                onClick={() => toggleSize(size)}
                                className={`rounded-md border px-3 py-1 text-sm transition-colors ${
                                    selected
                                        ? 'bg-lumiris-emerald border-lumiris-emerald text-white'
                                        : 'border-border text-muted-foreground hover:border-lumiris-emerald'
                                }`}
                            >
                                {size}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Couleurs */}
            <div className="space-y-2 md:col-span-2">
                <Label htmlFor="color-input">Couleurs</Label>
                <div className="flex gap-2">
                    <Input
                        id="color-input"
                        value={colorInput}
                        placeholder="Écru, Marine, Terracotta…"
                        onChange={(e) => setColorInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                addColor();
                            }
                        }}
                    />
                    <button
                        type="button"
                        onClick={addColor}
                        className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 rounded-md px-3 text-sm text-white"
                    >
                        Ajouter
                    </button>
                </div>
                {(form.colors ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {(form.colors ?? []).map((color) => (
                            <Badge key={color} variant="secondary" className="gap-1">
                                {color}
                                <button
                                    type="button"
                                    onClick={() => removeColor(color)}
                                    aria-label={`Supprimer ${color}`}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        </WizardStepFrame>
    );
}
