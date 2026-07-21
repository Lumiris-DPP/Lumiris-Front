'use client';

import { useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2, UploadCloud } from 'lucide-react';
import type { KybDetailsRequest, KybDetailsResponse, KybDocumentLabel } from '@lumiris/api-client';
import { Card } from '@lumiris/ui/components/card';
import { Checkbox } from '@lumiris/ui/components/checkbox';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';

const CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
    { value: '0', label: 'Entreprise individuelle (Solo)' },
    { value: '1', label: 'Société' },
    { value: '2', label: 'Association' },
];

const DOCUMENTS: Array<{ key: KybDocumentLabel; title: string; hint: string }> = [
    { key: 'legal_representative_id_doc', title: "Pièce d'identité", hint: 'du représentant légal' },
    { key: 'kbis', title: 'Extrait KBIS', hint: 'de moins de 3 mois' },
    { key: 'proof_of_address', title: 'Justificatif de domicile', hint: 'de moins de 3 mois' },
    { key: 'rib', title: 'RIB', hint: 'pour les versements' },
];

// --- Shared draft state, staged across the wizard's steps and only sent to the backend in one
// KybDetailsRequest at the final "Validation" step (the API has no partial-submission concept). ---

export interface KybDraft {
    category: string;
    businessEntity: string;
    vatNumber: string;
    addressLine1: string;
    addressCity: string;
    addressPostalCode: string;
    addressCountry: string;
    repFirstName: string;
    repLastName: string;
    repBirthDate: string;
    repNationality: string;
    repAddressLine1: string;
    repAddressCity: string;
    repAddressPostalCode: string;
    repAddressCountry: string;
    repIsUbo: boolean;
    repOwnershipPercentage: string;
}

export function defaultKybDraft(kyb?: KybDetailsResponse): KybDraft {
    return {
        category: String(kyb?.category ?? 1),
        businessEntity: kyb?.businessEntity ?? '',
        vatNumber: kyb?.vatNumber ?? '',
        addressLine1: kyb?.addressLine1 ?? '',
        addressCity: kyb?.addressCity ?? '',
        addressPostalCode: kyb?.addressPostalCode ?? '',
        addressCountry: kyb?.addressCountry ?? 'FR',
        repFirstName: kyb?.repFirstName ?? '',
        repLastName: kyb?.repLastName ?? '',
        repBirthDate: kyb?.repBirthDate ?? '',
        repNationality: kyb?.repNationality ?? 'FR',
        repAddressLine1: kyb?.repAddressLine1 ?? '',
        repAddressCity: kyb?.repAddressCity ?? '',
        repAddressPostalCode: kyb?.repAddressPostalCode ?? '',
        repAddressCountry: kyb?.repAddressCountry ?? 'FR',
        repIsUbo: kyb?.repIsUbo ?? false,
        repOwnershipPercentage: kyb?.repOwnershipPercentage != null ? String(kyb.repOwnershipPercentage) : '',
    };
}

export function kybDraftToRequest(draft: KybDraft, termsAccepted: boolean): KybDetailsRequest {
    return {
        category: Number(draft.category) as 0 | 1 | 2,
        businessEntity: draft.businessEntity,
        vatNumber: draft.vatNumber.trim() || undefined,
        addressLine1: draft.addressLine1,
        addressCity: draft.addressCity,
        addressPostalCode: draft.addressPostalCode,
        addressCountry: draft.addressCountry,
        repFirstName: draft.repFirstName,
        repLastName: draft.repLastName,
        repBirthDate: draft.repBirthDate,
        repNationality: draft.repNationality,
        repAddressLine1: draft.repAddressLine1,
        repAddressCity: draft.repAddressCity,
        repAddressPostalCode: draft.repAddressPostalCode,
        repAddressCountry: draft.repAddressCountry,
        repIsUbo: draft.repIsUbo,
        repOwnershipPercentage: draft.repOwnershipPercentage.trim() ? Number(draft.repOwnershipPercentage) : undefined,
        termsAccepted,
    };
}

export function isEntityDraftValid(draft: KybDraft): boolean {
    return (
        draft.businessEntity.trim() !== '' &&
        draft.addressLine1.trim() !== '' &&
        draft.addressCity.trim() !== '' &&
        draft.addressPostalCode.trim() !== '' &&
        draft.addressCountry.trim() !== ''
    );
}

export function isRepresentativeDraftValid(draft: KybDraft): boolean {
    return (
        draft.repFirstName.trim() !== '' &&
        draft.repLastName.trim() !== '' &&
        draft.repBirthDate.trim() !== '' &&
        draft.repNationality.trim() !== '' &&
        draft.repAddressLine1.trim() !== '' &&
        draft.repAddressCity.trim() !== '' &&
        draft.repAddressPostalCode.trim() !== '' &&
        draft.repAddressCountry.trim() !== ''
    );
}

interface DraftFieldsProps {
    draft: KybDraft;
    onChange: (patch: Partial<KybDraft>) => void;
}

export function EntityFields({ draft, onChange }: DraftFieldsProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="grid gap-2">
                <Label htmlFor="kyb-category">Catégorie</Label>
                <Select value={draft.category} onValueChange={(v) => onChange({ category: v })}>
                    <SelectTrigger id="kyb-category" className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {CATEGORY_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                                {o.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label htmlFor="kyb-business-entity">Forme juridique</Label>
                    <Input
                        id="kyb-business-entity"
                        placeholder="SARL, SAS, EI…"
                        value={draft.businessEntity}
                        onChange={(e) => onChange({ businessEntity: e.target.value })}
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="kyb-vat">N° TVA intracommunautaire</Label>
                    <Input
                        id="kyb-vat"
                        placeholder="FR12345678901 (optionnel)"
                        value={draft.vatNumber}
                        onChange={(e) => onChange({ vatNumber: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="kyb-address-line1">Adresse du siège</Label>
                <Input
                    id="kyb-address-line1"
                    placeholder="Numéro et voie"
                    value={draft.addressLine1}
                    onChange={(e) => onChange({ addressLine1: e.target.value })}
                    required
                />
            </div>
            <div className="grid grid-cols-3 gap-3">
                <Input
                    aria-label="Ville"
                    placeholder="Ville"
                    value={draft.addressCity}
                    onChange={(e) => onChange({ addressCity: e.target.value })}
                    required
                />
                <Input
                    aria-label="Code postal"
                    placeholder="Code postal"
                    value={draft.addressPostalCode}
                    onChange={(e) => onChange({ addressPostalCode: e.target.value })}
                    required
                />
                <Input
                    aria-label="Pays"
                    placeholder="Pays (FR)"
                    maxLength={2}
                    value={draft.addressCountry}
                    onChange={(e) => onChange({ addressCountry: e.target.value.toUpperCase() })}
                    required
                />
            </div>
        </div>
    );
}

export function RepresentativeFields({ draft, onChange }: DraftFieldsProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label htmlFor="kyb-rep-first-name">Prénom</Label>
                    <Input
                        id="kyb-rep-first-name"
                        value={draft.repFirstName}
                        onChange={(e) => onChange({ repFirstName: e.target.value })}
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="kyb-rep-last-name">Nom</Label>
                    <Input
                        id="kyb-rep-last-name"
                        value={draft.repLastName}
                        onChange={(e) => onChange({ repLastName: e.target.value })}
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label htmlFor="kyb-rep-birth-date">Date de naissance</Label>
                    <Input
                        id="kyb-rep-birth-date"
                        type="date"
                        value={draft.repBirthDate}
                        onChange={(e) => onChange({ repBirthDate: e.target.value })}
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="kyb-rep-nationality">Nationalité</Label>
                    <Input
                        id="kyb-rep-nationality"
                        placeholder="FR"
                        maxLength={2}
                        value={draft.repNationality}
                        onChange={(e) => onChange({ repNationality: e.target.value.toUpperCase() })}
                        required
                    />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="kyb-rep-address-line1">Adresse personnelle</Label>
                <Input
                    id="kyb-rep-address-line1"
                    placeholder="Numéro et voie"
                    value={draft.repAddressLine1}
                    onChange={(e) => onChange({ repAddressLine1: e.target.value })}
                    required
                />
            </div>
            <div className="grid grid-cols-3 gap-3">
                <Input
                    aria-label="Ville"
                    placeholder="Ville"
                    value={draft.repAddressCity}
                    onChange={(e) => onChange({ repAddressCity: e.target.value })}
                    required
                />
                <Input
                    aria-label="Code postal"
                    placeholder="Code postal"
                    value={draft.repAddressPostalCode}
                    onChange={(e) => onChange({ repAddressPostalCode: e.target.value })}
                    required
                />
                <Input
                    aria-label="Pays"
                    placeholder="Pays (FR)"
                    maxLength={2}
                    value={draft.repAddressCountry}
                    onChange={(e) => onChange({ repAddressCountry: e.target.value.toUpperCase() })}
                    required
                />
            </div>

            <div className="flex items-start gap-3 pt-1">
                <Checkbox
                    id="kyb-rep-ubo"
                    checked={draft.repIsUbo}
                    onCheckedChange={(v) => onChange({ repIsUbo: v === true })}
                    className="mt-0.5"
                />
                <Label htmlFor="kyb-rep-ubo" className="cursor-pointer text-sm font-normal leading-snug">
                    Le représentant détient plus de 25&nbsp;% du capital (bénéficiaire effectif)
                </Label>
            </div>
            {draft.repIsUbo ? (
                <div className="grid max-w-40 gap-2">
                    <Label htmlFor="kyb-rep-ownership">% détenu</Label>
                    <Input
                        id="kyb-rep-ownership"
                        type="number"
                        min={0}
                        max={100}
                        value={draft.repOwnershipPercentage}
                        onChange={(e) => onChange({ repOwnershipPercentage: e.target.value })}
                    />
                </div>
            ) : null}
        </div>
    );
}

interface DocumentInfo {
    uploaded: boolean;
    url?: string;
    expiresAt?: string;
}

function documentInfo(kyb: KybDetailsResponse | undefined, label: KybDocumentLabel): DocumentInfo {
    switch (label) {
        case 'legal_representative_id_doc':
            return { uploaded: Boolean(kyb?.idDocUploaded), url: kyb?.idDocUrl, expiresAt: kyb?.idDocExpiresAt };
        case 'kbis':
            return { uploaded: Boolean(kyb?.kbisUploaded), url: kyb?.kbisUrl, expiresAt: kyb?.kbisExpiresAt };
        case 'proof_of_address':
            return {
                uploaded: Boolean(kyb?.proofOfAddressUploaded),
                url: kyb?.proofOfAddressUrl,
                expiresAt: kyb?.proofOfAddressExpiresAt,
            };
        case 'rib':
            return { uploaded: Boolean(kyb?.ribUploaded), url: kyb?.ribUrl, expiresAt: kyb?.ribExpiresAt };
    }
}

interface DocumentsSectionProps {
    initialKyb?: KybDetailsResponse;
    onUploadDocument: (label: KybDocumentLabel, file: File, expiresAt?: string) => void;
    uploadingLabel: KybDocumentLabel | null;
}

export function DocumentsSection({ initialKyb, onUploadDocument, uploadingLabel }: DocumentsSectionProps) {
    const [pendingExpiry, setPendingExpiry] = useState<Record<KybDocumentLabel, string>>({
        legal_representative_id_doc: '',
        kbis: '',
        proof_of_address: '',
        rib: '',
    });

    return (
        <ul className="flex flex-col gap-3">
            {DOCUMENTS.map((doc) => {
                const info = documentInfo(initialKyb, doc.key);
                const uploading = uploadingLabel === doc.key;
                return (
                    <li
                        key={doc.key}
                        className="border-border/60 bg-background flex flex-col gap-2 rounded-lg border p-3"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-foreground text-sm font-medium">{doc.title}</p>
                                <p className="text-muted-foreground text-xs">{doc.hint}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                {info.uploaded && info.url ? (
                                    <a
                                        href={info.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs underline underline-offset-2"
                                    >
                                        Voir <ExternalLink className="h-3 w-3" />
                                    </a>
                                ) : null}
                                <label
                                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                                        info.uploaded
                                            ? 'border-lumiris-emerald/40 bg-lumiris-emerald/10 text-lumiris-emerald'
                                            : 'border-border bg-card text-muted-foreground hover:bg-muted'
                                    }`}
                                >
                                    {uploading ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : info.uploaded ? (
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                    ) : (
                                        <UploadCloud className="h-3.5 w-3.5" />
                                    )}
                                    {info.uploaded ? 'Remplacer' : 'Téléverser'}
                                    <input
                                        type="file"
                                        aria-label={doc.title}
                                        accept="application/pdf,image/*"
                                        className="sr-only"
                                        disabled={uploading}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            e.target.value = '';
                                            if (file)
                                                onUploadDocument(doc.key, file, pendingExpiry[doc.key] || undefined);
                                        }}
                                    />
                                </label>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor={`kyb-doc-expiry-${doc.key}`} className="text-muted-foreground text-[11px]">
                                Date d&apos;expiration (optionnel)
                            </Label>
                            <Input
                                id={`kyb-doc-expiry-${doc.key}`}
                                type="date"
                                value={pendingExpiry[doc.key] || info.expiresAt || ''}
                                onChange={(e) => setPendingExpiry((prev) => ({ ...prev, [doc.key]: e.target.value }))}
                                className="h-7 w-40 text-xs"
                            />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

export function DocumentsCard(props: DocumentsSectionProps) {
    return (
        <Card className="flex flex-col gap-3 p-5">
            <h2 className="text-foreground text-sm font-semibold">Documents justificatifs</h2>
            <DocumentsSection {...props} />
        </Card>
    );
}
