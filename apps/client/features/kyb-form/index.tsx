'use client';

import { useState, type FormEvent } from 'react';
import { CheckCircle2, ExternalLink, Loader2, UploadCloud } from 'lucide-react';
import type { KybDetailsRequest, KybDetailsResponse, KybDocumentLabel } from '@lumiris/api-client';
import { Button } from '@lumiris/ui/components/button';
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

interface KybFormProps {
    initialKyb?: KybDetailsResponse;
    onSubmit: (req: KybDetailsRequest) => void;
    isSubmitting: boolean;
    submitError?: string | null;
    onUploadDocument: (label: KybDocumentLabel, file: File, expiresAt?: string) => void;
    uploadingLabel: KybDocumentLabel | null;
}

export function KybForm({
    initialKyb,
    onSubmit,
    isSubmitting,
    submitError,
    onUploadDocument,
    uploadingLabel,
}: KybFormProps) {
    const [category, setCategory] = useState(String(initialKyb?.category ?? 1));
    const [businessEntity, setBusinessEntity] = useState(initialKyb?.businessEntity ?? '');
    const [vatNumber, setVatNumber] = useState(initialKyb?.vatNumber ?? '');
    const [addressLine1, setAddressLine1] = useState(initialKyb?.addressLine1 ?? '');
    const [addressCity, setAddressCity] = useState(initialKyb?.addressCity ?? '');
    const [addressPostalCode, setAddressPostalCode] = useState(initialKyb?.addressPostalCode ?? '');
    const [addressCountry, setAddressCountry] = useState(initialKyb?.addressCountry ?? 'FR');
    const [repFirstName, setRepFirstName] = useState(initialKyb?.repFirstName ?? '');
    const [repLastName, setRepLastName] = useState(initialKyb?.repLastName ?? '');
    const [repBirthDate, setRepBirthDate] = useState(initialKyb?.repBirthDate ?? '');
    const [repNationality, setRepNationality] = useState(initialKyb?.repNationality ?? 'FR');
    const [repAddressLine1, setRepAddressLine1] = useState(initialKyb?.repAddressLine1 ?? '');
    const [repAddressCity, setRepAddressCity] = useState(initialKyb?.repAddressCity ?? '');
    const [repAddressPostalCode, setRepAddressPostalCode] = useState(initialKyb?.repAddressPostalCode ?? '');
    const [repAddressCountry, setRepAddressCountry] = useState(initialKyb?.repAddressCountry ?? 'FR');
    const [repIsUbo, setRepIsUbo] = useState(initialKyb?.repIsUbo ?? false);
    const [repOwnershipPercentage, setRepOwnershipPercentage] = useState(
        initialKyb?.repOwnershipPercentage != null ? String(initialKyb.repOwnershipPercentage) : '',
    );
    const [termsAccepted, setTermsAccepted] = useState(Boolean(initialKyb?.termsAcceptedAt));
    const [formError, setFormError] = useState<string | null>(null);
    const [pendingExpiry, setPendingExpiry] = useState<Record<KybDocumentLabel, string>>({
        legal_representative_id_doc: '',
        kbis: '',
        proof_of_address: '',
        rib: '',
    });

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!termsAccepted) {
            setFormError("Vous devez accepter les conditions générales d'utilisation.");
            return;
        }
        setFormError(null);
        onSubmit({
            category: Number(category) as 0 | 1 | 2,
            businessEntity,
            vatNumber: vatNumber.trim() || undefined,
            addressLine1,
            addressCity,
            addressPostalCode,
            addressCountry,
            repFirstName,
            repLastName,
            repBirthDate,
            repNationality,
            repAddressLine1,
            repAddressCity,
            repAddressPostalCode,
            repAddressCountry,
            repIsUbo,
            repOwnershipPercentage: repOwnershipPercentage.trim() ? Number(repOwnershipPercentage) : undefined,
            termsAccepted,
        });
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <Card className="flex flex-col gap-4 p-5">
                <h2 className="text-foreground text-sm font-semibold">Entité juridique</h2>

                <div className="grid gap-2">
                    <Label htmlFor="kyb-category">Catégorie</Label>
                    <Select value={category} onValueChange={setCategory}>
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
                            value={businessEntity}
                            onChange={(e) => setBusinessEntity(e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="kyb-vat">N° TVA intracommunautaire</Label>
                        <Input
                            id="kyb-vat"
                            placeholder="FR12345678901 (optionnel)"
                            value={vatNumber}
                            onChange={(e) => setVatNumber(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="kyb-address-line1">Adresse du siège</Label>
                    <Input
                        id="kyb-address-line1"
                        placeholder="Numéro et voie"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        required
                    />
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <Input
                        aria-label="Ville"
                        placeholder="Ville"
                        value={addressCity}
                        onChange={(e) => setAddressCity(e.target.value)}
                        required
                    />
                    <Input
                        aria-label="Code postal"
                        placeholder="Code postal"
                        value={addressPostalCode}
                        onChange={(e) => setAddressPostalCode(e.target.value)}
                        required
                    />
                    <Input
                        aria-label="Pays"
                        placeholder="Pays (FR)"
                        maxLength={2}
                        value={addressCountry}
                        onChange={(e) => setAddressCountry(e.target.value.toUpperCase())}
                        required
                    />
                </div>
            </Card>

            <Card className="flex flex-col gap-4 p-5">
                <h2 className="text-foreground text-sm font-semibold">Représentant légal</h2>

                <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                        <Label htmlFor="kyb-rep-first-name">Prénom</Label>
                        <Input
                            id="kyb-rep-first-name"
                            value={repFirstName}
                            onChange={(e) => setRepFirstName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="kyb-rep-last-name">Nom</Label>
                        <Input
                            id="kyb-rep-last-name"
                            value={repLastName}
                            onChange={(e) => setRepLastName(e.target.value)}
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
                            value={repBirthDate}
                            onChange={(e) => setRepBirthDate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="kyb-rep-nationality">Nationalité</Label>
                        <Input
                            id="kyb-rep-nationality"
                            placeholder="FR"
                            maxLength={2}
                            value={repNationality}
                            onChange={(e) => setRepNationality(e.target.value.toUpperCase())}
                            required
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="kyb-rep-address-line1">Adresse personnelle</Label>
                    <Input
                        id="kyb-rep-address-line1"
                        placeholder="Numéro et voie"
                        value={repAddressLine1}
                        onChange={(e) => setRepAddressLine1(e.target.value)}
                        required
                    />
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <Input
                        aria-label="Ville"
                        placeholder="Ville"
                        value={repAddressCity}
                        onChange={(e) => setRepAddressCity(e.target.value)}
                        required
                    />
                    <Input
                        aria-label="Code postal"
                        placeholder="Code postal"
                        value={repAddressPostalCode}
                        onChange={(e) => setRepAddressPostalCode(e.target.value)}
                        required
                    />
                    <Input
                        aria-label="Pays"
                        placeholder="Pays (FR)"
                        maxLength={2}
                        value={repAddressCountry}
                        onChange={(e) => setRepAddressCountry(e.target.value.toUpperCase())}
                        required
                    />
                </div>

                <div className="flex items-start gap-3 pt-1">
                    <Checkbox
                        id="kyb-rep-ubo"
                        checked={repIsUbo}
                        onCheckedChange={(v) => setRepIsUbo(v === true)}
                        className="mt-0.5"
                    />
                    <Label htmlFor="kyb-rep-ubo" className="cursor-pointer text-sm font-normal leading-snug">
                        Le représentant détient plus de 25&nbsp;% du capital (bénéficiaire effectif)
                    </Label>
                </div>
                {repIsUbo ? (
                    <div className="grid max-w-40 gap-2">
                        <Label htmlFor="kyb-rep-ownership">% détenu</Label>
                        <Input
                            id="kyb-rep-ownership"
                            type="number"
                            min={0}
                            max={100}
                            value={repOwnershipPercentage}
                            onChange={(e) => setRepOwnershipPercentage(e.target.value)}
                        />
                    </div>
                ) : null}
            </Card>

            <Card className="flex flex-col gap-3 p-5">
                <h2 className="text-foreground text-sm font-semibold">Documents justificatifs</h2>
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
                                                        onUploadDocument(
                                                            doc.key,
                                                            file,
                                                            pendingExpiry[doc.key] || undefined,
                                                        );
                                                }}
                                            />
                                        </label>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label
                                        htmlFor={`kyb-doc-expiry-${doc.key}`}
                                        className="text-muted-foreground text-[11px]"
                                    >
                                        Date d&apos;expiration (optionnel)
                                    </Label>
                                    <Input
                                        id={`kyb-doc-expiry-${doc.key}`}
                                        type="date"
                                        value={pendingExpiry[doc.key] || info.expiresAt || ''}
                                        onChange={(e) =>
                                            setPendingExpiry((prev) => ({ ...prev, [doc.key]: e.target.value }))
                                        }
                                        className="h-7 w-40 text-xs"
                                    />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </Card>

            <div className="flex items-start gap-3">
                <Checkbox
                    id="kyb-terms"
                    checked={termsAccepted}
                    onCheckedChange={(v) => setTermsAccepted(v === true)}
                    className="mt-0.5"
                />
                <Label htmlFor="kyb-terms" className="cursor-pointer text-sm font-normal leading-snug">
                    Je certifie l&apos;exactitude de ces informations et j&apos;accepte les Conditions Générales
                    d&apos;Utilisation de LUMIRIS.
                </Label>
            </div>

            {(formError ?? submitError) ? (
                <p className="text-destructive text-xs" role="alert">
                    {formError ?? submitError}
                </p>
            ) : null}

            <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-lumiris-cyan hover:bg-lumiris-cyan/90 h-10 w-full text-white disabled:opacity-60"
            >
                {isSubmitting ? 'Envoi…' : 'Envoyer mon dossier KYB'}
            </Button>
        </form>
    );
}
