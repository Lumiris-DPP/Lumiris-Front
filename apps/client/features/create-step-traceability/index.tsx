'use client';

import { useEffect, useMemo, useState } from 'react';
import type { TraceabilityInfo } from '@lumiris/types';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Checkbox } from '@lumiris/ui/components/checkbox';
import { WizardStepFrame } from '@/features/wizard-shell/step-frame';
import { useStepNavigation } from '@/features/wizard-shell/use-step-navigation';
import { useDraftStore } from '@/lib/draft-store';
import { validateStep } from './schema';

function generateId(prefix: string): string {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

export function CreateStepTraceability({ draftId }: { draftId: string }) {
    const draft = useDraftStore((s) => s.drafts[draftId]);
    const setTraceability = useDraftStore((s) => s.setTraceability);
    const { goNext, goTo } = useStepNavigation(draftId);

    const [form, setForm] = useState<TraceabilityInfo>(
        draft?.traceability ?? {
            manufacturedAt: new Date().toISOString().slice(0, 10),
            reachCompliant: false,
        },
    );

    useEffect(() => {
        if (draft) setForm(draft.traceability);
    }, [draft]);

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
                materials: draft?.materials ?? [],
                careInstructions: draft?.careInstructions ?? [],
                certifications: draft?.certifications ?? [],
                traceability: form,
                eco: draft?.eco ?? {},
            }),
        [form, draft],
    );

    const handleNext = () => {
        setTraceability(draftId, form);
        goNext('traceability', 'eco');
    };

    const handlePrev = () => {
        setTraceability(draftId, form);
        goTo('care');
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
                <Label htmlFor="manufactured-at">Date de fabrication / lancement du lot</Label>
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
                <div className="flex gap-2">
                    <Input
                        id="batch"
                        value={form.batchNumber ?? ''}
                        placeholder="LOT-2026-001"
                        onChange={(e) => setForm((f) => ({ ...f, batchNumber: e.target.value }))}
                    />
                    <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, batchNumber: generateId('LOT') }))}
                        className="border-border text-muted-foreground hover:border-lumiris-emerald hover:text-lumiris-emerald shrink-0 rounded-md border px-3 text-xs transition-colors"
                    >
                        Générer
                    </button>
                </div>
            </div>

            {/* GTIN / EAN */}
            <div className="space-y-2">
                <Label htmlFor="gtin">GTIN / EAN (code-barres)</Label>
                <div className="flex gap-2">
                    <Input
                        id="gtin"
                        value={form.gtin ?? ''}
                        placeholder="1234567890123"
                        maxLength={14}
                        onChange={(e) => setForm((f) => ({ ...f, gtin: e.target.value }))}
                    />
                    <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, gtin: generateId('EAN') }))}
                        className="border-border text-muted-foreground hover:border-lumiris-emerald hover:text-lumiris-emerald shrink-0 rounded-md border px-3 text-xs transition-colors"
                    >
                        Générer
                    </button>
                </div>
            </div>

            {/* SKU */}
            <div className="space-y-2">
                <Label htmlFor="sku">SKU (référence interne)</Label>
                <div className="flex gap-2">
                    <Input
                        id="sku"
                        value={form.sku ?? ''}
                        placeholder="SKU-001"
                        onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                    />
                    <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, sku: generateId('SKU') }))}
                        className="border-border text-muted-foreground hover:border-lumiris-emerald hover:text-lumiris-emerald shrink-0 rounded-md border px-3 text-xs transition-colors"
                    >
                        Générer
                    </button>
                </div>
            </div>

            {/* Conformité REACH */}
            <div className="border-border bg-muted/30 space-y-2 rounded-lg border p-4 md:col-span-2">
                <div className="flex items-start gap-3">
                    <Checkbox
                        id="reach"
                        checked={form.reachCompliant}
                        onCheckedChange={(v) => setForm((f) => ({ ...f, reachCompliant: v === true }))}
                        className="mt-0.5"
                    />
                    <div className="space-y-1">
                        <label htmlFor="reach" className="cursor-pointer text-sm font-medium leading-snug">
                            Je certifie que ce produit respecte les réglementations européennes REACH (absence de
                            colorants azoïques interdits et substances toxiques). <span className="text-destructive">*</span>
                        </label>
                        <p className="text-muted-foreground text-[11px]">
                            Obligatoire pour vendre en Europe. Vos fournisseurs de tissus doivent vous fournir
                            cette garantie.
                        </p>
                    </div>
                </div>
            </div>
        </WizardStepFrame>
    );
}
