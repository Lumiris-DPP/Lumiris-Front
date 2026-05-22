'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, ScanLine } from 'lucide-react';
import { getEffectiveStatus } from '@lumiris/types';
import type { CertificationRef, Material } from '@lumiris/types';
import { Button } from '@lumiris/ui/components/button';
import { WizardStepFrame } from '@/features/wizard-shell/step-frame';
import { useStepNavigation } from '@/features/wizard-shell/use-step-navigation';
import { InvoiceScanPicker } from '@/features/create-step-invoice-scan/picker';
import { mergeMaterials } from '@/features/create-step-invoice-scan/apply-extraction';
import { useCertificatesForArtisan } from '@/lib/certificates-store';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { useDraftStore } from '@/lib/draft-store';
import { FiberRow } from './fiber-row';
import { validateStep } from './schema';

function newRow(): Material {
    return {
        fiber: 'linen',
        percentage: 0,
        supplierId: '',
        originCountry: 'FR',
        certifications: [],
    };
}

export function CreateStepComposition({ draftId }: { draftId: string }) {
    const draft = useDraftStore((s) => s.drafts[draftId]);
    const setMaterials = useDraftStore((s) => s.setMaterials);
    const { goNext, goTo } = useStepNavigation(draftId);
    const artisan = useCurrentArtisan();
    const artisanCerts = useCertificatesForArtisan(artisan.id);

    const now = useMemo(() => new Date(), []);
    const availableCerts = useMemo<CertificationRef[]>(
        () =>
            artisanCerts.filter((c) => {
                if (getEffectiveStatus(c, now) === 'Expired') return false;
                if (c.kind === 'CUSTOM' && !c.customName) return false;
                return true;
            }),
        [artisanCerts, now],
    );

    const [rows, setRows] = useState<Material[]>(draft?.materials.length ? [...draft.materials] : [newRow()]);
    const [scanOpen, setScanOpen] = useState(false);

    useEffect(() => {
        if (draft && draft.materials.length > 0) setRows([...draft.materials]);
    }, [draft]);

    const total = useMemo(() => rows.reduce((sum, r) => sum + (Number(r.percentage) || 0), 0), [rows]);

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
                materials: rows,
                steps: draft?.steps ?? [],
                certifications: draft?.certifications ?? [],
                warranty: draft?.warranty ?? { durationMonths: 0, terms: '' },
            }),
        [rows, draft],
    );
    const nextMissing = validation.ok ? [] : validation.missing;

    const updateRow = (idx: number, patch: Partial<Material>) => {
        setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    };

    const handleNext = () => {
        setMaterials(draftId, rows);
        goNext('composition', 'invoice');
    };

    return (
        <WizardStepFrame
            draftId={draftId}
            step="composition"
            onPrev={() => goTo('identification')}
            onNext={handleNext}
            nextMissing={nextMissing}
            contentClassName="space-y-4"
        >
            <div className="border-lumiris-emerald/30 bg-lumiris-emerald/5 flex flex-col gap-2 rounded-lg border border-dashed p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-foreground text-sm font-medium">Accélérateur — pré-remplir depuis une facture</p>
                    <p className="text-muted-foreground text-[11px]">
                        Scannez une facture fournisseur pour générer une amorce de composition (extraction simulée en
                        mode démo).
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setScanOpen(true)}
                    className="border-lumiris-emerald/40 text-lumiris-emerald hover:bg-lumiris-emerald/10 shrink-0"
                >
                    <ScanLine className="mr-1.5 h-3.5 w-3.5" />
                    Scanner une facture
                </Button>
            </div>

            <InvoiceScanPicker
                artisanId={artisan.id}
                open={scanOpen}
                onOpenChange={setScanOpen}
                onInject={(extracted) => setRows((cur) => mergeMaterials(cur, extracted))}
            />

            <div className="space-y-3">
                {rows.map((row, idx) => (
                    <FiberRow
                        key={idx}
                        row={row}
                        idx={idx}
                        availableCerts={availableCerts}
                        onChange={(patch) => updateRow(idx, patch)}
                        onRemove={() => setRows((rs) => rs.filter((_, i) => i !== idx))}
                    />
                ))}
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
                <Button variant="outline" size="sm" onClick={() => setRows((rs) => [...rs, newRow()])}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Ajouter une fibre
                </Button>
                <p className="text-muted-foreground font-mono text-xs">Somme {total.toFixed(0)} %</p>
            </div>
        </WizardStepFrame>
    );
}
