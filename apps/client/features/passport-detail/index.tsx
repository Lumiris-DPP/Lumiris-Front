'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Download, FileText, XCircle } from 'lucide-react';
import { mockPassportById } from '@lumiris/mock-data';
import type { Passport, GarmentKind } from '@lumiris/types';
import { IrisScoreCard } from '@lumiris/scoring-ui';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import { Badge } from '@lumiris/ui/components/badge';
import { Toaster } from '@lumiris/ui/components/sonner';
import { fetchDppForm, type DppFormDto, type DppFormDocumentDto } from '@/lib/dpp-api';
import { QrCodeCard } from './QrCodeCard';
import { useAuthStore } from '@/lib/auth-store';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { draftToPassport, useDraftStore } from '@/lib/draft-store';

const PLACEHOLDER_PHOTO = '/default_product_picture.webp';

const CATEGORY_TO_KIND: Record<string, GarmentKind> = {
    top: 'sweater',
    bottom: 'trouser',
    dress: 'other',
    outerwear: 'jacket',
    shoe: 'shoe',
    accessory: 'accessory',
    other: 'other',
};

const DOC_TYPE_LABELS: Record<string, string> = {
    CARE_GUIDE: "Guide d'entretien avancé",
    ORIGIN_CERTIFICATES: "Certificats d'origine",
    REPAIR_MANUAL: 'Manuel de réparation technique',
    END_OF_LIFE_GUIDE: 'Instructions de recyclage / fin de vie',
    TEST_REPORTS: 'Rapports de test',
    TRANSACTION_CERTIFICATES: 'Certificats de transaction',
    CREATION_PASSPORT: 'Passeport de création',
    EU_DOC_OF_CONFORMITY: 'Déclaration UE de conformité',
    REACH_COMPLIANCE: 'Conformité REACH',
    SALE_INVOICE: 'Facture de vente',
};

const CATEGORY_LABELS: Record<string, string> = {
    top: 'Haut (t-shirt, pull, chemise…)',
    bottom: 'Bas (pantalon, jupe, short…)',
    dress: 'Robe / Combinaison',
    outerwear: 'Veste / Manteau',
    shoe: 'Chaussure',
    accessory: 'Accessoire',
    other: 'Autre',
    sweater: 'Pull / Sweat',
    shirt: 'Chemise',
    jacket: 'Veste / Manteau',
    trouser: 'Pantalon',
};

const FIBER_LABELS: Record<string, string> = {
    cotton: 'Coton',
    wool: 'Laine',
    linen: 'Lin',
    silk: 'Soie',
    hemp: 'Chanvre',
    cashmere: 'Cachemire',
    leather: 'Cuir',
    'recycled-polyester': 'Polyester recyclé',
    other: 'Autre',
};

const CARE_SYMBOLS: ReadonlyArray<{ code: string; label: string; svgPath: string }> = [
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

const VISIBILITY_GROUPS: Array<{ key: string; label: string; description: string }> = [
    { key: 'PUBLIC_USERS', label: 'Documents publics', description: 'Accessibles à tous les consommateurs' },
    { key: 'CIRCULAR_OPERATORS', label: 'Fin de vie & Réparation', description: 'Ateliers de réparation, recycleurs' },
    { key: 'AUTHORITIES', label: 'Autorités compétentes', description: 'Douanes, autorités de marché' },
];

function dppToPassport(dpp: DppFormDto, artisanId: string): Passport {
    return {
        id: dpp.id,
        gs1: { gtin: dpp.gtin ?? '', serial: dpp.id, verificationUrl: '' },
        status: dpp.status === 'VALID' ? 'Published' : 'InCompletion',
        createdAt: dpp.createdAt,
        updatedAt: dpp.createdAt,
        artisanId,
        garment: {
            kind: CATEGORY_TO_KIND[dpp.productCategory ?? ''] ?? 'other',
            name: dpp.productName ?? undefined,
            reference: dpp.sku ?? dpp.id,
            mainPhotoUrl: dpp.mainPhotoUrl ?? '',
            dimensions: {},
            retailPrice: 0,
            currency: 'EUR',
            description: dpp.productDescription ?? undefined,
            originCountry: dpp.originCountry ?? undefined,
            availableSizes: dpp.availableSizes ?? undefined,
            colors: dpp.colors ?? undefined,
        },
        materials: (dpp.materials ?? []).map((m) => ({
            fiber: m.fiber as Passport['materials'][number]['fiber'],
            percentage: m.percentage,
            supplierId: '',
            originCountry: m.originCountry,
            certifications: [],
        })),
        steps: [],
        certifications: [],
        warranty: { durationMonths: 0, terms: dpp.warrantyDescription ?? '' },
        recycledPct: dpp.recycledPct ?? undefined,
    };
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-[11px] uppercase tracking-wider">{label}</span>
            <span className="text-foreground text-sm">{value}</span>
        </div>
    );
}

function BooleanField({ value }: { value: boolean | null | undefined }) {
    if (value === null || value === undefined) return <span className="text-muted-foreground text-sm">—</span>;
    return value ? (
        <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle className="h-3.5 w-3.5" /> Oui
        </span>
    ) : (
        <span className="flex items-center gap-1 text-sm text-red-500">
            <XCircle className="h-3.5 w-3.5" /> Non
        </span>
    );
}

function DocumentRow({ doc }: { doc: DppFormDocumentDto }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
                <FileText className="text-muted-foreground h-4 w-4 shrink-0" />
                <div className="min-w-0">
                    <p className="text-foreground truncate text-sm font-medium">
                        {DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType}
                    </p>
                    <p className="text-muted-foreground truncate text-[11px]">{doc.filename}</p>
                </div>
            </div>
            <a
                href={doc.url}
                download={doc.filename}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                aria-label={`Télécharger ${doc.filename}`}
            >
                <Download className="h-4 w-4" />
            </a>
        </div>
    );
}

export function PassportDetail({ passportId }: { passportId: string }) {
    const artisan = useCurrentArtisan();
    const token = useAuthStore((s) => s.token);
    const drafts = useDraftStore((s) => s.drafts);
    const draft = drafts[passportId];

    const [apiPassport, setApiPassport] = useState<Passport | null>(null);
    const [apiDpp, setApiDpp] = useState<DppFormDto | null>(null);
    const [loading, setLoading] = useState(false);
    const [notFound, setNotFound] = useState(false);

    const fixed = useMemo(() => mockPassportById(passportId), [passportId]);

    const passport = useMemo<Passport | null>(() => {
        if (draft) return draftToPassport(draft);
        if (fixed) return fixed;
        return apiPassport;
    }, [draft, fixed, apiPassport]);

    useEffect(() => {
        if (draft || fixed || !token) return;
        setLoading(true);
        fetchDppForm(token, passportId)
            .then((dpp) => {
                setApiDpp(dpp);
                setApiPassport(dppToPassport(dpp, artisan.id));
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [passportId, token, draft, fixed, artisan.id]);

    if (loading) {
        return <div className="text-muted-foreground p-8 text-sm">Chargement…</div>;
    }

    if (notFound || (!passport && !loading)) {
        return (
            <div className="p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>DPP introuvable</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline">
                            <Link href="/passports">
                                <ArrowLeft className="mr-1.5 h-4 w-4" /> Retour à la liste
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!passport) return null;

    const dpp = apiDpp;
    const displayPhoto = dpp?.mainPhotoUrl || PLACEHOLDER_PHOTO;
    const documents = dpp?.documents ?? [];

    return (
        <>
            <Toaster position="bottom-right" />
            <div className="grid gap-6 p-8 lg:grid-cols-[1fr_360px]">
                <div className="space-y-6">
                    <Button asChild variant="ghost" size="sm" className="self-start">
                        <Link href="/passports">
                            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Liste
                        </Link>
                    </Button>

                    {/* Card 1 — Le Produit */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <CardTitle className="truncate">
                                        {dpp?.productName || passport.garment.name || 'Sans nom'}
                                    </CardTitle>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        créé le {new Date(passport.createdAt).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                                {dpp && (
                                    <Badge
                                        variant={dpp.status === 'VALID' ? 'default' : 'destructive'}
                                        className="shrink-0"
                                    >
                                        {dpp.status === 'VALID' ? 'Valide' : 'Invalide'}
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="border-border mx-auto w-1/2 overflow-hidden rounded-xl border">
                                <Image
                                    src={displayPhoto}
                                    alt={`Visuel principal — ${dpp?.productName || passport.garment.reference}`}
                                    width={320}
                                    height={320}
                                    unoptimized
                                    className="aspect-square w-full object-contain"
                                />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <InfoRow
                                        label="Description"
                                        value={dpp?.productDescription ?? passport.garment.description}
                                    />
                                </div>
                                <InfoRow
                                    label="Catégorie"
                                    value={
                                        CATEGORY_LABELS[dpp?.productCategory ?? passport.garment.kind] ??
                                        dpp?.productCategory ??
                                        passport.garment.kind
                                    }
                                />
                                <InfoRow
                                    label="Pays d'origine"
                                    value={dpp?.originCountry ?? passport.garment.originCountry}
                                />
                                <InfoRow
                                    label="Tailles disponibles"
                                    value={
                                        (dpp?.availableSizes ?? passport.garment.availableSizes ?? []).length > 0 ? (
                                            <div className="flex flex-wrap gap-1 pt-0.5">
                                                {(dpp?.availableSizes ?? passport.garment.availableSizes ?? []).map(
                                                    (s) => (
                                                        <Badge key={s} variant="secondary" className="text-xs">
                                                            {s}
                                                        </Badge>
                                                    ),
                                                )}
                                            </div>
                                        ) : null
                                    }
                                />
                                <InfoRow
                                    label="Couleurs"
                                    value={
                                        (dpp?.colors ?? passport.garment.colors ?? []).length > 0 ? (
                                            <div className="flex flex-wrap gap-1 pt-0.5">
                                                {(dpp?.colors ?? passport.garment.colors ?? []).map((c) => (
                                                    <Badge key={c} variant="outline" className="text-xs">
                                                        {c}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : null
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 2 — Composition & Entretien */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Composition & Entretien</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {(dpp?.materials ?? passport.materials).length > 0 && (
                                <div className="space-y-1.5">
                                    <p className="text-muted-foreground text-[11px] uppercase tracking-wider">
                                        Matières
                                    </p>
                                    {(dpp?.materials ?? passport.materials).map((m, i) => (
                                        <p key={i} className="text-foreground text-sm">
                                            <span className="font-mono">{m.percentage}%</span>{' '}
                                            {FIBER_LABELS[m.fiber] ?? m.fiber}
                                            {m.originCountry && (
                                                <span className="text-muted-foreground"> · {m.originCountry}</span>
                                            )}
                                        </p>
                                    ))}
                                </div>
                            )}

                            {(dpp?.careInstructions ?? []).length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-muted-foreground text-[11px] uppercase tracking-wider">
                                        Instructions d&apos;entretien
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                        {CARE_SYMBOLS.filter((s) => (dpp?.careInstructions ?? []).includes(s.code)).map(
                                            (s) => (
                                                <div
                                                    key={s.code}
                                                    className="border-border flex items-center gap-2 rounded-lg border px-3 py-2"
                                                >
                                                    <Image
                                                        src={s.svgPath}
                                                        alt=""
                                                        aria-hidden
                                                        width={24}
                                                        height={24}
                                                        className="h-6 w-6 shrink-0"
                                                    />
                                                    <span className="text-foreground truncate text-sm">{s.label}</span>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}

                            {dpp?.careNotes && (
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-[11px] uppercase tracking-wider">
                                        Notes d&apos;entretien
                                    </p>
                                    <p className="text-foreground whitespace-pre-wrap text-sm">{dpp.careNotes}</p>
                                </div>
                            )}

                            {(dpp?.materials ?? passport.materials).length === 0 &&
                                (dpp?.careInstructions ?? []).length === 0 &&
                                !dpp?.careNotes && (
                                    <p className="text-muted-foreground text-sm">Aucune donnée renseignée.</p>
                                )}
                        </CardContent>
                    </Card>

                    {/* Card 3 — Traçabilité */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Traçabilité</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <InfoRow label="Date de fabrication" value={dpp?.manufacturedAt} />
                                <InfoRow label="Numéro de lot" value={dpp?.batchNumber} />
                                <InfoRow label="GTIN" value={dpp?.gtin ?? passport.gs1?.gtin} />
                                <InfoRow label="SKU" value={dpp?.sku ?? passport.garment.reference} />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-muted-foreground text-[11px] uppercase tracking-wider">
                                        Conformité REACH
                                    </span>
                                    <BooleanField value={dpp?.reachCompliant} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 4 — Durabilité & Fin de vie */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Durabilité & Fin de vie</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <InfoRow
                                    label="Matières recyclées"
                                    value={
                                        (dpp?.recycledPct ?? passport.recycledPct) != null
                                            ? `${dpp?.recycledPct ?? passport.recycledPct} %`
                                            : null
                                    }
                                />
                                <InfoRow
                                    label="Garantie"
                                    value={dpp?.warrantyDescription ?? passport.warranty?.terms}
                                />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-muted-foreground text-[11px] uppercase tracking-wider">
                                        Réparable
                                    </span>
                                    <BooleanField value={dpp?.isRepairable} />
                                </div>
                                <InfoRow label="Instructions fin de vie" value={dpp?.endOfLifeInstructions} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 5 — Documents */}
                    {documents.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Documents</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {VISIBILITY_GROUPS.map(({ key, label, description }) => {
                                    const group = documents.filter((d) => d.visibility === key);
                                    if (group.length === 0) return null;
                                    return (
                                        <div key={key} className="space-y-2">
                                            <div>
                                                <p className="text-foreground text-sm font-medium">{label}</p>
                                                <p className="text-muted-foreground text-[11px]">{description}</p>
                                            </div>
                                            <div className="space-y-1.5">
                                                {group.map((doc) => (
                                                    <DocumentRow key={doc.fileId} doc={doc} />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    )}
                </div>

                <aside className="lg:sticky lg:top-24 lg:self-start">
                    <IrisScoreCard dppId={!draft && !fixed ? passportId : undefined} />
                    {dpp?.publicCode && <QrCodeCard publicCode={dpp.publicCode} />}
                </aside>
            </div>
        </>
    );
}
