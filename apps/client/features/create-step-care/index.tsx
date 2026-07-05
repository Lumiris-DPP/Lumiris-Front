'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Plus, Trash2 } from 'lucide-react';
import type { DppMaterial, CareInstructionCode, Fiber } from '@lumiris/types';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Textarea } from '@lumiris/ui/components/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { WizardStepFrame } from '@/features/wizard-shell/step-frame';
import { useStepNavigation } from '@/features/wizard-shell/use-step-navigation';
import { useDraftStore } from '@/lib/draft-store';
import { validateStep } from './schema';

const FIBERS: ReadonlyArray<{ value: Fiber; label: string }> = [
    { value: 'cotton', label: 'Coton' },
    { value: 'wool', label: 'Laine' },
    { value: 'linen', label: 'Lin' },
    { value: 'silk', label: 'Soie' },
    { value: 'hemp', label: 'Chanvre' },
    { value: 'cashmere', label: 'Cachemire' },
    { value: 'leather', label: 'Cuir' },
    { value: 'recycled-polyester', label: 'Polyester recyclé' },
    { value: 'other', label: 'Autre' },
];

const CARE_SYMBOLS: ReadonlyArray<{ code: CareInstructionCode; label: string; svgPath: string }> = [
    { code: 'wash-30', label: 'Lavage 30°', svgPath: '/ginetex/ginetex--30c-fine-wash.svg' },
    { code: 'wash-40', label: 'Lavage 40°', svgPath: '/ginetex/ginetex--40c-mild-wash.svg' },
    { code: 'wash-60', label: 'Lavage 60°', svgPath: '/ginetex/ginetex--60c-coloured-wash.svg' },
    { code: 'no-wash', label: 'Ne pas laver', svgPath: '/ginetex/ginetex--do-not-wash.svg' },
    { code: 'dry-clean', label: 'Nettoyage à sec', svgPath: '/ginetex/ginetex--dry-cleaning.svg' },
    { code: 'no-dry-clean', label: 'Pas de nettoyage à sec', svgPath: '/ginetex/ginetex--do-not-dry-clean.svg' },
    { code: 'tumble-dry', label: 'Sèche-linge autorisé', svgPath: '/ginetex/ginetex--tumble-drying.svg' },
    { code: 'no-tumble', label: 'Pas de sèche-linge', svgPath: '/ginetex/ginetex--tumble-drying-1.svg' },
    { code: 'iron-low', label: 'Repassage doux', svgPath: '/ginetex/ginetex--iron-at-low-temperature.svg' },
    { code: 'iron-med', label: 'Repassage moyen', svgPath: '/ginetex/ginetex--iron-at-moderate-temperature.svg' },
    { code: 'iron-high', label: 'Repassage fort', svgPath: '/ginetex/ginetex--hot-iron.svg' },
    { code: 'no-iron', label: 'Ne pas repasser', svgPath: '/ginetex/ginetex--do-not-iron.svg' },
];

export function CreateStepCare({ draftId }: { draftId: string }) {
    const draft = useDraftStore((s) => s.drafts[draftId]);
    const setMaterials = useDraftStore((s) => s.setMaterials);
    const setCareInstructions = useDraftStore((s) => s.setCareInstructions);
    const setCareNotes = useDraftStore((s) => s.setCareNotes);
    const { goNext, goTo } = useStepNavigation(draftId);

    const [materials, setLocalMaterials] = useState<DppMaterial[]>(draft?.materials ?? []);
    const [care, setLocalCare] = useState<CareInstructionCode[]>(draft?.careInstructions ?? []);
    const [careNotes, setLocalCareNotes] = useState<string>(draft?.careNotes ?? '');

    useEffect(() => {
        if (draft) {
            setLocalMaterials(draft.materials);
            setLocalCare(draft.careInstructions);
            setLocalCareNotes(draft.careNotes);
        }
    }, [draft]);

    const total = materials.reduce((sum, m) => sum + m.percentage, 0);

    const validation = useMemo(
        () =>
            validateStep({
                garment: draft?.garment ?? {
                    kind: 'sweater',
                    reference: '',
                    mainPhotoUrl: '',
                    dimensions: {},
                    retailPrice: 0,
                    currency: 'EUR',
                },
                materials,
                careInstructions: care,
                careNotes,
                traceability: draft?.traceability ?? { manufacturedAt: '', reachCompliant: false },
                eco: draft?.eco ?? {},
            }),
        [materials, care, careNotes, draft],
    );

    const handleNext = () => {
        setMaterials(draftId, materials);
        setCareInstructions(draftId, care);
        setCareNotes(draftId, careNotes);
        goNext('care', 'traceability');
    };

    const handlePrev = () => {
        setMaterials(draftId, materials);
        setCareInstructions(draftId, care);
        setCareNotes(draftId, careNotes);
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

    return (
        <WizardStepFrame
            draftId={draftId}
            step="care"
            onPrev={handlePrev}
            onNext={handleNext}
            nextMissing={validation.ok ? [] : validation.missing}
            contentClassName="space-y-8"
        >
            {/* Composition des fibres */}
            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Composition des fibres</Label>
                    <span
                        className={`font-mono text-sm font-semibold ${total === 100 ? 'text-lumiris-emerald' : total > 100 ? 'text-destructive' : 'text-lumiris-amber'}`}
                    >
                        {total}% / 100%
                    </span>
                </div>

                <div className="space-y-2">
                    {materials.map((m, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <Select value={m.fiber} onValueChange={(v) => updateMaterial(i, { fiber: v as Fiber })}>
                                <SelectTrigger className="w-44">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FIBERS.map((f) => (
                                        <SelectItem key={f.value} value={f.value}>
                                            {f.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="relative w-24">
                                <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={m.percentage || ''}
                                    onChange={(e) => updateMaterial(i, { percentage: Number(e.target.value) || 0 })}
                                    className="pr-7"
                                />
                                <span className="text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 text-sm">
                                    %
                                </span>
                            </div>
                            <Input
                                value={m.originCountry}
                                placeholder="Pays d'origine"
                                onChange={(e) => updateMaterial(i, { originCountry: e.target.value })}
                                className="flex-1"
                            />
                            <button
                                type="button"
                                onClick={() => removeMaterial(i)}
                                className="text-muted-foreground hover:text-destructive"
                                aria-label="Supprimer cette fibre"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={addMaterial}
                    className="border-border text-muted-foreground hover:border-lumiris-emerald hover:text-lumiris-emerald flex items-center gap-1.5 rounded-md border border-dashed px-3 py-1.5 text-sm transition-colors"
                >
                    <Plus className="h-3.5 w-3.5" /> Ajouter une fibre
                </button>
            </section>

            {/* Instructions d'entretien */}
            <section className="space-y-3">
                <Label className="text-base font-semibold">Instructions d&apos;entretien (GINETEX)</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {CARE_SYMBOLS.map((s) => {
                        const checked = care.includes(s.code);
                        return (
                            <button
                                key={s.code}
                                type="button"
                                onClick={() => toggleCare(s.code)}
                                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                                    checked
                                        ? 'bg-lumiris-emerald/10 border-lumiris-emerald text-lumiris-emerald'
                                        : 'border-border text-muted-foreground hover:border-lumiris-emerald/50'
                                }`}
                            >
                                <Image
                                    src={s.svgPath}
                                    alt=""
                                    aria-hidden
                                    width={24}
                                    height={24}
                                    className="h-6 w-6 shrink-0"
                                />
                                <span className="truncate">{s.label}</span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Notes d'entretien */}
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
