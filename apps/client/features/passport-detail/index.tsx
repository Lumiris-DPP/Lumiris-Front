'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Download, FileText, XCircle } from 'lucide-react';
import { computeScore } from '@lumiris/core/scoring';
import { mockCertificates, mockPassportById } from '@lumiris/mock-data';
import type { Passport, GarmentKind } from '@lumiris/types';
import {
    IrisGrade,
    MissingFieldsBadge,
    ScoreBreakdown,
    ScoreCapWarning,
} from '@lumiris/scoring-ui';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import { Badge } from '@lumiris/ui/components/badge';
import { Toaster } from '@lumiris/ui/components/sonner';
import { fetchDppForm, type DppFormDto, type DppFormDocumentDto } from '@/lib/dpp-api';
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

const VISIBILITY_GROUPS: { key: string; label: string; description: string }[] = [
    { key: 'PUBLIC_USERS', label: 'Documents publics', description: 'Accessibles à tous les consommateurs' },
    { key: 'CIRCULAR_OPERATORS', label: 'Opérateurs de circularité', description: 'Ateliers de réparation, recycleurs' },
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
    return value
        ? <span className="text-green-600 flex items-center gap-1 text-sm"><CheckCircle className="h-3.5 w-3.5" /> Oui</span>
        : <span className="text-red-500 flex items-center gap-1 text-sm"><XCircle className="h-3.5 w-3.5" /> Non</span>;
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

    const now = useMemo(() => new Date(), []);
    const score = useMemo(
        () => passport ? computeScore(passport, { artisan, certificates: mockCertificates, now }) : null,
        [artisan, passport, now],
    );

    if (loading) {
        return <div className="text-muted-foreground p-8 text-sm">Chargement…</div>;
    }

    if (notFound || (!passport && !loading)) {
        return (
            <div className="p-8">
                <Card>
                    <CardHeader><CardTitle>DPP introuvable</CardTitle></CardHeader>
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

    if (!passport || !score) return null;

    const dpp = apiDpp;
    const displayPhoto = dpp?.mainPhotoUrl || PLACEHOLDER_PHOTO;
    const documents = dpp?.documents ?? [];

    return (
        <>
        <Toaster position="bottom-right" />
        <div className="grid gap-6 p-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/passports">
                            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Liste
                        </Link>
                    </Button>
                    {dpp && (
                        <Badge variant={dpp.status === 'VALID' ? 'default' : 'destructive'}>
                            {dpp.status === 'VALID' ? 'Valide' : 'Invalide'}
                        </Badge>
                    )}
                </div>

                {/* Card 1 — Le Produit */}
                <Card>
                    <CardHeader>
                        <CardTitle>{dpp?.productName || passport.garment.name || 'Sans nom'}</CardTitle>
                        <p className="text-muted-foreground text-sm">
                            créé le {new Date(passport.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="border-border overflow-hidden rounded-xl border">
                            <Image
                                src={displayPhoto}
                                alt={`Visuel principal — ${dpp?.productName || passport.garment.reference}`}
                                width={640}
                                height={640}
                                unoptimized
                                className="aspect-square w-full object-contain"
                            />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <InfoRow label="Description" value={dpp?.productDescription ?? passport.garment.description} />
                            <InfoRow label="Catégorie" value={dpp?.productCategory ?? passport.garment.kind} />
                            <InfoRow label="Pays d'origine" value={dpp?.originCountry ?? passport.garment.originCountry} />
                            <InfoRow
                                label="Tailles disponibles"
                                value={
                                    (dpp?.availableSizes ?? passport.garment.availableSizes ?? []).length > 0
                                        ? (
                                            <div className="flex flex-wrap gap-1 pt-0.5">
                                                {(dpp?.availableSizes ?? passport.garment.availableSizes ?? []).map((s) => (
                                                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                                                ))}
                                            </div>
                                        )
                                        : null
                                }
                            />
                            <InfoRow
                                label="Couleurs"
                                value={
                                    (dpp?.colors ?? passport.garment.colors ?? []).length > 0
                                        ? (
                                            <div className="flex flex-wrap gap-1 pt-0.5">
                                                {(dpp?.colors ?? passport.garment.colors ?? []).map((c) => (
                                                    <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                                                ))}
                                            </div>
                                        )
                                        : null
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Card 2 — Composition & Entretien */}
                <Card>
                    <CardHeader><CardTitle>Composition & Entretien</CardTitle></CardHeader>
                    <CardContent className="space-y-5">
                        {(dpp?.materials ?? passport.materials).length > 0 && (
                            <div className="space-y-1">
                                <p className="text-muted-foreground text-[11px] uppercase tracking-wider">Matières</p>
                                {(dpp?.materials ?? passport.materials).map((m, i) => (
                                    <p key={i} className="text-foreground text-sm">
                                        <span className="font-mono">{m.percentage}%</span> {m.fiber}
                                        {m.originCountry && <span className="text-muted-foreground"> · {m.originCountry}</span>}
                                    </p>
                                ))}
                            </div>
                        )}

                        {(dpp?.careInstructions ?? []).length > 0 && (
                            <div className="space-y-1">
                                <p className="text-muted-foreground text-[11px] uppercase tracking-wider">Instructions d'entretien</p>
                                <ul className="space-y-0.5">
                                    {(dpp?.careInstructions ?? []).map((instr, i) => (
                                        <li key={i} className="text-foreground text-sm">· {instr}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {dpp?.careNotes && (
                            <div className="space-y-1">
                                <p className="text-muted-foreground text-[11px] uppercase tracking-wider">Notes d'entretien</p>
                                <p className="text-foreground whitespace-pre-wrap text-sm">{dpp.careNotes}</p>
                            </div>
                        )}

                        {(dpp?.materials ?? passport.materials).length === 0
                            && (dpp?.careInstructions ?? []).length === 0
                            && !dpp?.careNotes && (
                            <p className="text-muted-foreground text-sm">Aucune donnée renseignée.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Card 3 — Traçabilité */}
                <Card>
                    <CardHeader><CardTitle>Traçabilité</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <InfoRow label="Date de fabrication" value={dpp?.manufacturedAt} />
                            <InfoRow label="Numéro de lot" value={dpp?.batchNumber} />
                            <InfoRow label="GTIN" value={dpp?.gtin ?? passport.gs1?.gtin} />
                            <InfoRow label="SKU" value={dpp?.sku ?? passport.garment.reference} />
                            <div className="flex flex-col gap-0.5">
                                <span className="text-muted-foreground text-[11px] uppercase tracking-wider">Conformité REACH</span>
                                <BooleanField value={dpp?.reachCompliant} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Card 4 — Durabilité & Fin de vie */}
                <Card>
                    <CardHeader><CardTitle>Durabilité & Fin de vie</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <InfoRow
                                label="Matières recyclées"
                                value={(dpp?.recycledPct ?? passport.recycledPct) != null
                                    ? `${dpp?.recycledPct ?? passport.recycledPct} %`
                                    : null}
                            />
                            <InfoRow label="Garantie" value={dpp?.warrantyDescription ?? passport.warranty?.terms} />
                            <div className="flex flex-col gap-0.5">
                                <span className="text-muted-foreground text-[11px] uppercase tracking-wider">Réparable</span>
                                <BooleanField value={dpp?.isRepairable} />
                            </div>
                            <InfoRow label="Instructions fin de vie" value={dpp?.endOfLifeInstructions} />
                        </div>
                    </CardContent>
                </Card>

                {/* Card 5 — Documents */}
                {documents.length > 0 && (
                    <Card>
                        <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
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

            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                <Card>
                    <CardHeader>
                        <p className="text-muted-foreground text-[11px] uppercase tracking-wider">Score Iris</p>
                        <div className="mt-2 flex items-center gap-3">
                            <IrisGrade grade={score.grade} size="lg" />
                            <p className="text-foreground font-mono text-2xl font-semibold">
                                {score.total.toFixed(1)}
                                <span className="text-muted-foreground/70 ml-0.5 text-sm font-normal">/ 100</span>
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ScoreBreakdown breakdown={score.breakdown} weights={score.weights} />
                        {score.cap?.applied && <ScoreCapWarning cap={score.cap} />}
                        <div className="flex items-center justify-between border-t pt-3">
                            <span className="text-muted-foreground text-xs">Champs ESPR/AGEC</span>
                            <MissingFieldsBadge passport={passport} showWhenComplete />
                        </div>
                    </CardContent>
                </Card>
            </aside>
        </div>
        </>
    );
}
