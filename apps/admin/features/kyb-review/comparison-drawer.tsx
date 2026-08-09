'use client';

import { AlertTriangle, CheckCircle2, Clock3, ExternalLink, FileWarning, XCircle } from 'lucide-react';
import type { KybDetailsResponse, KybStatus } from '@lumiris/api-client';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { DetailDrawer } from '@lumiris/ui/components/detail-drawer';

const CATEGORY_LABEL: Record<number, string> = {
    0: 'Entreprise individuelle (Solo)',
    1: 'Société',
    2: 'Association',
};

const KYB_STATUS_LABEL: Record<KybStatus, string> = {
    PENDING: 'En attente',
    ONGOING: 'En cours de revue',
    VALIDATED: 'Validé',
    REJECTED: 'Rejeté',
    INCOMPLETE: 'Incomplet',
};

const KYB_STATUS_TONE: Record<KybStatus, string> = {
    PENDING: 'bg-lumiris-amber/10 text-lumiris-amber border-lumiris-amber/30',
    ONGOING: 'bg-lumiris-cyan/10 text-lumiris-cyan border-lumiris-cyan/30',
    VALIDATED: 'bg-lumiris-emerald/10 text-lumiris-emerald border-lumiris-emerald/30',
    REJECTED: 'bg-lumiris-rose/10 text-lumiris-rose border-lumiris-rose/30',
    INCOMPLETE: 'bg-lumiris-amber/10 text-lumiris-amber border-lumiris-amber/30',
};

interface Dirigeant {
    nom?: string;
    prenoms?: string;
    denomination?: string;
    qualite?: string;
    type_dirigeant?: string;
}

function parseDirigeants(json?: string): Dirigeant[] {
    if (!json) return [];
    try {
        const parsed: unknown = JSON.parse(json);
        return Array.isArray(parsed) ? (parsed as Dirigeant[]) : [];
    } catch {
        return [];
    }
}

function formatAddress(line1?: string, city?: string, postalCode?: string, country?: string): string {
    return [line1, [postalCode, city].filter(Boolean).join(' '), country].filter(Boolean).join(', ') || '—';
}

// Loose case/whitespace-insensitive comparison — SIRENE addresses are one flat string while the
// declared address is split into fields, so an exact match is unrealistic; this only helps flag
// obviously unrelated addresses, not validate formatting.
function looksConsistent(declared: string, sirene?: string): boolean | null {
    if (!sirene || declared === '—') return null;
    const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const d = norm(declared);
    const s = norm(sirene);
    return d.length > 0 && (s.includes(d.slice(0, 12)) || d.includes(s.slice(0, 12)));
}

function isExpired(dateIso?: string): boolean {
    if (!dateIso) return false;
    return new Date(dateIso).getTime() < Date.now();
}

function ConsistencyBadge({ consistent }: { consistent: boolean | null }) {
    if (consistent === null) return null;
    return consistent ? (
        <Badge className="bg-lumiris-emerald/10 text-lumiris-emerald border-lumiris-emerald/30 gap-1">
            <CheckCircle2 className="h-3 w-3" /> Cohérent avec SIRENE
        </Badge>
    ) : (
        <Badge className="bg-lumiris-amber/10 text-lumiris-amber border-lumiris-amber/30 gap-1">
            <AlertTriangle className="h-3 w-3" /> À vérifier — différent de SIRENE
        </Badge>
    );
}

function DocRow({
    label,
    uploaded,
    url,
    expiresAt,
    nameMatch,
}: {
    label: string;
    uploaded: boolean;
    url?: string;
    expiresAt?: string;
    nameMatch?: boolean;
}) {
    const expired = isExpired(expiresAt);
    return (
        <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center justify-between gap-2">
                <span className="text-foreground">{label}</span>
                <div className="flex items-center gap-2">
                    {uploaded ? (
                        <span className="text-lumiris-emerald inline-flex items-center gap-1 text-xs font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Reçu
                        </span>
                    ) : (
                        <span className="text-destructive inline-flex items-center gap-1 text-xs font-medium">
                            <XCircle className="h-3.5 w-3.5" /> Manquant
                        </span>
                    )}
                    {uploaded && url ? (
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-lumiris-cyan inline-flex items-center gap-1 text-xs underline underline-offset-2"
                        >
                            Voir <ExternalLink className="h-3 w-3" />
                        </a>
                    ) : null}
                </div>
            </div>
            {uploaded && expiresAt ? (
                <p className={`text-[11px] ${expired ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                    {expired ? 'Expiré le' : 'Expire le'} {new Date(expiresAt).toLocaleDateString('fr-FR')}
                    {expired ? ' — à renouveler' : ''}
                </p>
            ) : null}
            {nameMatch !== undefined ? (
                nameMatch ? (
                    <span className="text-lumiris-emerald inline-flex w-fit items-center gap-1 text-[11px]">
                        <CheckCircle2 className="h-3 w-3" /> Nom du représentant détecté sur le document (OCR)
                    </span>
                ) : (
                    <span className="text-lumiris-amber inline-flex w-fit items-center gap-1 text-[11px]">
                        <FileWarning className="h-3 w-3" /> Nom du représentant non détecté sur le document (OCR)
                    </span>
                )
            ) : null}
        </div>
    );
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-muted-foreground text-[11px] uppercase tracking-wide">{label}</p>
            <p className="text-foreground text-sm">{value || '—'}</p>
        </div>
    );
}

interface KybComparisonDrawerProps {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    siret?: string;
    kyb?: KybDetailsResponse;
    onApprove: () => void;
    onReject: () => void;
    onMarkOngoing: () => void;
    onMarkIncomplete: () => void;
    approving: boolean;
    rejecting: boolean;
    markingOngoing: boolean;
    markingIncomplete: boolean;
    canApprove: boolean;
    canReject: boolean;
}

export function KybComparisonDrawer({
    open,
    onClose,
    title,
    subtitle,
    siret,
    kyb,
    onApprove,
    onReject,
    onMarkOngoing,
    onMarkIncomplete,
    approving,
    rejecting,
    markingOngoing,
    markingIncomplete,
    canApprove,
    canReject,
}: KybComparisonDrawerProps) {
    const declaredAddress = formatAddress(
        kyb?.addressLine1,
        kyb?.addressCity,
        kyb?.addressPostalCode,
        kyb?.addressCountry,
    );
    const addressConsistent = looksConsistent(declaredAddress, kyb?.sireneSiegeAddress);
    const dirigeants = parseDirigeants(kyb?.sireneDirigeantsJson);
    const repFullName = [kyb?.repFirstName, kyb?.repLastName].filter(Boolean).join(' ');
    const pending = approving || rejecting || markingOngoing || markingIncomplete;

    return (
        <DetailDrawer
            open={open}
            onOpenChange={(next) => !next && onClose()}
            title={title}
            subtitle={subtitle}
            width="lg"
        >
            <div className="flex flex-col gap-6">
                {kyb ? (
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-[11px] uppercase tracking-wide">
                            Statut du dossier
                        </span>
                        <Badge variant="outline" className={`font-mono text-[10px] ${KYB_STATUS_TONE[kyb.kybStatus]}`}>
                            {KYB_STATUS_LABEL[kyb.kybStatus]}
                        </Badge>
                    </div>
                ) : null}
                {kyb?.kybReviewNote ? (
                    <p className="border-border/60 bg-background rounded-lg border p-3 text-xs">
                        <span className="text-muted-foreground">Note admin : </span>
                        {kyb.kybReviewNote}
                    </p>
                ) : null}

                <section className="flex flex-col gap-3">
                    <h3 className="text-foreground text-sm font-semibold">Entité juridique déclarée</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <Field
                            label="Catégorie"
                            value={kyb?.category != null ? (CATEGORY_LABEL[kyb.category] ?? String(kyb.category)) : ''}
                        />
                        <Field label="Forme juridique" value={kyb?.businessEntity ?? ''} />
                        <Field label="SIRET" value={siret ?? ''} />
                        <Field label="N° TVA" value={kyb?.vatNumber ?? ''} />
                    </div>
                    <Field label="Adresse déclarée" value={declaredAddress} />
                    <ConsistencyBadge consistent={addressConsistent} />
                </section>

                <section className="border-border/60 flex flex-col gap-2 rounded-lg border p-3">
                    <h3 className="text-foreground text-sm font-semibold">Données SIRENE (référence)</h3>
                    <Field label="SIREN" value={kyb?.sireneSiren ?? ''} />
                    <Field label="Adresse du siège" value={kyb?.sireneSiegeAddress ?? ''} />
                    <Field label="Code nature juridique (INSEE)" value={kyb?.sireneNatureJuridique ?? ''} />
                    {dirigeants.length > 0 ? (
                        <div>
                            <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
                                Dirigeants déclarés à l&apos;INSEE
                            </p>
                            <ul className="mt-1 flex flex-col gap-1">
                                {dirigeants.map((d, i) => (
                                    <li key={i} className="text-foreground text-xs">
                                        {d.denomination ?? [d.prenoms, d.nom].filter(Boolean).join(' ')}
                                        {d.qualite ? (
                                            <span className="text-muted-foreground"> — {d.qualite}</span>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </section>

                <section className="flex flex-col gap-3">
                    <h3 className="text-foreground text-sm font-semibold">Représentant légal déclaré</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Nom" value={repFullName} />
                        <Field label="Date de naissance" value={kyb?.repBirthDate ?? ''} />
                        <Field label="Nationalité" value={kyb?.repNationality ?? ''} />
                        <Field
                            label="Bénéficiaire effectif (UBO)"
                            value={
                                kyb?.repIsUbo
                                    ? `Oui${kyb.repOwnershipPercentage != null ? ` — ${kyb.repOwnershipPercentage}%` : ''}`
                                    : 'Non'
                            }
                        />
                    </div>
                    <Field
                        label="Adresse personnelle"
                        value={formatAddress(
                            kyb?.repAddressLine1,
                            kyb?.repAddressCity,
                            kyb?.repAddressPostalCode,
                            kyb?.repAddressCountry,
                        )}
                    />
                    {dirigeants.some(
                        (d) => kyb?.repLastName && d.nom?.toUpperCase().includes(kyb.repLastName.toUpperCase()),
                    ) ? (
                        <Badge className="bg-lumiris-emerald/10 text-lumiris-emerald border-lumiris-emerald/30 w-fit gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Nom retrouvé parmi les dirigeants SIRENE
                        </Badge>
                    ) : (
                        <Badge className="bg-lumiris-amber/10 text-lumiris-amber border-lumiris-amber/30 w-fit gap-1">
                            <AlertTriangle className="h-3 w-3" /> Nom non retrouvé parmi les dirigeants SIRENE
                        </Badge>
                    )}
                </section>

                <section className="flex flex-col gap-3">
                    <h3 className="text-foreground text-sm font-semibold">Documents</h3>
                    <DocRow
                        label="Pièce d'identité du représentant"
                        uploaded={Boolean(kyb?.idDocUploaded)}
                        url={kyb?.idDocUrl}
                        expiresAt={kyb?.idDocExpiresAt}
                        nameMatch={kyb?.idDocNameMatch}
                    />
                    <DocRow
                        label="Extrait KBIS"
                        uploaded={Boolean(kyb?.kbisUploaded)}
                        url={kyb?.kbisUrl}
                        expiresAt={kyb?.kbisExpiresAt}
                    />
                    <DocRow
                        label="RIB"
                        uploaded={Boolean(kyb?.ribUploaded)}
                        url={kyb?.ribUrl}
                        expiresAt={kyb?.ribExpiresAt}
                    />
                </section>

                <div className="flex flex-wrap justify-end gap-2 pt-2">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={onMarkOngoing}
                        className="h-8 gap-1.5"
                    >
                        <Clock3 className="h-3.5 w-3.5" />
                        En cours
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={!canReject || pending}
                        onClick={onMarkIncomplete}
                        className="border-lumiris-amber/40 text-lumiris-amber hover:bg-lumiris-amber/10 h-8 gap-1.5"
                    >
                        <FileWarning className="h-3.5 w-3.5" />
                        Incomplet
                    </Button>
                    <Button
                        size="sm"
                        disabled={!canReject || pending}
                        onClick={onReject}
                        className="bg-lumiris-rose hover:bg-lumiris-rose/90 h-8 gap-1.5 text-white disabled:opacity-40"
                    >
                        <XCircle className="h-3.5 w-3.5" />
                        Rejeter
                    </Button>
                    <Button
                        size="sm"
                        disabled={!canApprove || pending}
                        onClick={onApprove}
                        className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 h-8 gap-1.5 text-white disabled:opacity-40"
                    >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Valider
                    </Button>
                </div>
            </div>
        </DetailDrawer>
    );
}
