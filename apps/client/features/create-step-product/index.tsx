'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GarmentInfo } from '@lumiris/types';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Textarea } from '@lumiris/ui/components/textarea';
import { WizardStepFrame } from '@/features/wizard-shell/step-frame';
import { useStepNavigation } from '@/features/wizard-shell/use-step-navigation';
import { DocUploadField } from '@/features/wizard-shell/doc-upload-field';
import { useDraftStore } from '@/lib/draft-store';
import { draftToValidationInput } from '@/features/wizard-shell/validation-input';
import { validateStep } from './schema';
import { CategoryField, ColorsField, PhotoField, SizesField } from './product-fields';

export function CreateStepProduct({ draftId }: { draftId: string }) {
    const draft = useDraftStore((s) => s.drafts[draftId]);
    const setGarment = useDraftStore((s) => s.setGarment);
    const setFile = useDraftStore((s) => s.setFile);
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

    const [photoFile, setPhotoFile] = useState<File | null>(() => draft?.files?.['PRODUCT_PHOTO'] ?? null);
    const [saleInvoiceFile, setSaleInvoiceFile] = useState<File | null>(() => draft?.files?.['SALE_INVOICE'] ?? null);
    const [creationPassportFile, setCreationPassportFile] = useState<File | null>(
        () => draft?.files?.['CREATION_PASSPORT'] ?? null,
    );

    const persistedGarment = draft?.garment;
    useEffect(() => {
        if (persistedGarment) setForm(persistedGarment);
    }, [persistedGarment]);

    const validation = useMemo(() => validateStep(draftToValidationInput(draft, { garment: form })), [form, draft]);

    const handleNext = () => {
        setGarment(draftId, { ...form, mainPhotoUrl: '' });
        setFile(draftId, 'PRODUCT_PHOTO', photoFile);
        setFile(draftId, 'SALE_INVOICE', saleInvoiceFile);
        setFile(draftId, 'CREATION_PASSPORT', creationPassportFile);
        goNext('product', 'care');
    };

    const toggleSize = (size: string) => {
        const current = form.availableSizes ?? [];
        setForm((f) => ({
            ...f,
            availableSizes: current.includes(size) ? current.filter((s) => s !== size) : [...current, size],
        }));
    };

    return (
        <WizardStepFrame
            draftId={draftId}
            step="product"
            onNext={handleNext}
            nextMissing={validation.ok ? [] : validation.missing}
            contentClassName="grid gap-5 md:grid-cols-2"
        >
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

            <CategoryField value={form.category} onChange={(category) => setForm((f) => ({ ...f, category }))} />

            <div className="space-y-2">
                <Label htmlFor="origin">
                    Pays d&apos;origine <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="origin"
                    value={form.originCountry ?? ''}
                    maxLength={60}
                    placeholder="France, Portugal, Inde…"
                    onChange={(e) => setForm((f) => ({ ...f, originCountry: e.target.value }))}
                />
                <p className="text-[11px] text-muted-foreground">
                    Pays où a lieu la dernière transformation majeure (coupe & couture).
                </p>
            </div>

            <PhotoField
                value={photoFile}
                onChange={setPhotoFile}
                existingUrl={draft?.existingDocs?.['PRODUCT_PHOTO']?.url}
            />

            <SizesField selected={form.availableSizes ?? []} onToggle={toggleSize} />

            <ColorsField colors={form.colors ?? []} onChange={(colors) => setForm((f) => ({ ...f, colors }))} />

            <div className="space-y-4 rounded-lg border border-border p-4 md:col-span-2">
                <p className="text-sm font-medium">Documents de la pièce</p>
                <DocUploadField
                    label="Facture d'Origine ou Certificat de Vente"
                    description="Un PDF sécurisé servant d'acte de propriété."
                    value={saleInvoiceFile}
                    onChange={setSaleInvoiceFile}
                    existing={draft?.existingDocs?.['SALE_INVOICE']}
                />
                <DocUploadField
                    label="Fiche d'Identité / Carnet de Création"
                    description="Un document PDF qui immortalise les croquis d'intention du designer, le nombre d'heures de travail passées dans l'atelier, et le nom des artisans ayant façonné la pièce."
                    value={creationPassportFile}
                    onChange={setCreationPassportFile}
                    existing={draft?.existingDocs?.['CREATION_PASSPORT']}
                />
            </div>
        </WizardStepFrame>
    );
}
