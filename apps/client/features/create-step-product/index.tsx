'use client';

import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Textarea } from '@lumiris/ui/components/textarea';
import { WizardStepFrame } from '@/features/wizard-shell/step-frame';
import { DocUploadField } from '@/features/wizard-shell/doc-upload-field';
import { useProductStep } from './hooks/use-product-step';
import { CategoryField, ColorsField, PhotoField, SizesField } from './components/product-fields';

/** Affiche les informations et documents de la pièce à passeporter. */
export function CreateStepProduct({ draftId }: { draftId: string }) {
    const {
        draft,
        form,
        setForm,
        photoFile,
        setPhotoFile,
        saleInvoiceFile,
        setSaleInvoiceFile,
        creationPassportFile,
        setCreationPassportFile,
        validation,
        handleNext,
        toggleSize,
        weight,
        setWeight,
        weightInvalid,
    } = useProductStep(draftId);

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

            <div className="space-y-2">
                <Label htmlFor="weight">Poids du vêtement (grammes)</Label>
                <Input
                    id="weight"
                    type="text"
                    inputMode="numeric"
                    className="w-40"
                    value={weight}
                    placeholder="450"
                    onChange={(e) => setWeight(e.target.value)}
                    aria-invalid={weightInvalid}
                    aria-describedby={weightInvalid ? 'weight-error' : undefined}
                />
                {weightInvalid && (
                    <p id="weight-error" role="alert" className="text-xs text-destructive">
                        Saisissez un poids entier entre 1 et 50 000 g.
                    </p>
                )}
                <p className="text-[11px] text-muted-foreground">
                    Facultatif. Renseigné, il affine les sous-scores carbone et eau ; laissé vide, ils sont simplement
                    exclus du calcul sans pénaliser le passeport.
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
