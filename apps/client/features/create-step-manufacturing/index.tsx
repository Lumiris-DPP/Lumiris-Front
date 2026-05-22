'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Artisan, ProductionStep } from '@lumiris/types';
import { Button } from '@lumiris/ui/components/button';
import { WizardStepFrame } from '@/features/wizard-shell/step-frame';
import { useStepNavigation } from '@/features/wizard-shell/use-step-navigation';
import { useDraftStore } from '@/lib/draft-store';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { ManufacturingRow } from './manufacturing-row';
import { validateStep } from './schema';

function newStep(idPrefix: string, idx: number, artisan: Artisan): ProductionStep {
    return {
        id: `${idPrefix}-step-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        kind: 'sewing',
        label: '',
        performedBy: artisan.atelierName,
        locationCity: artisan.city,
        locationCountry: 'FR',
        photos: [],
    };
}

export function CreateStepManufacturing({ draftId }: { draftId: string }) {
    const artisan = useCurrentArtisan();
    const draft = useDraftStore((s) => s.drafts[draftId]);
    const setSteps = useDraftStore((s) => s.setProductionSteps);
    const { goNext, goTo } = useStepNavigation(draftId);

    const [items, setItems] = useState<ProductionStep[]>(
        draft?.steps.length ? [...draft.steps] : [newStep(draftId, 0, artisan)],
    );

    const updateItem = (idx: number, patch: Partial<ProductionStep>) => {
        setItems((cur) => cur.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
    };

    const move = (idx: number, dir: -1 | 1) => {
        setItems((cur) => {
            const next = [...cur];
            const target = idx + dir;
            if (target < 0 || target >= next.length) return cur;
            const [item] = next.splice(idx, 1);
            if (item) next.splice(target, 0, item);
            return next;
        });
    };

    const remove = (idx: number) => setItems((cur) => cur.filter((_, i) => i !== idx));

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
                steps: items,
                certifications: draft?.certifications ?? [],
                warranty: draft?.warranty ?? { durationMonths: 0, terms: '' },
            }),
        [items, draft],
    );
    const nextMissing = validation.ok ? [] : validation.missing;

    const handleNext = () => {
        setSteps(draftId, items);
        goNext('manufacturing', 'certifications');
    };

    return (
        <WizardStepFrame
            draftId={draftId}
            step="manufacturing"
            onPrev={() => goTo('invoice')}
            onNext={handleNext}
            nextMissing={nextMissing}
            contentClassName="space-y-3"
        >
            {items.map((item, idx) => (
                <ManufacturingRow
                    key={item.id}
                    step={item}
                    idx={idx}
                    count={items.length}
                    onChange={(patch) => updateItem(idx, patch)}
                    onMoveUp={() => move(idx, -1)}
                    onMoveDown={() => move(idx, 1)}
                    onRemove={() => remove(idx)}
                />
            ))}

            <Button
                variant="outline"
                size="sm"
                onClick={() => setItems((cur) => [...cur, newStep(draftId, cur.length, artisan)])}
            >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Ajouter une étape
            </Button>
        </WizardStepFrame>
    );
}
