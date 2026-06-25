'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
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
import { fetchDppForm, type DppFormDto } from '@/lib/dpp-api';
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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
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
    const displayPhoto = dpp?.mainPhotoUrl || passport.garment.mainPhotoUrl || PLACEHOLDER_PHOTO;

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
                        <Image
                            src={displayPhoto}
                            alt={`Visuel principal du passeport ${passport.garment.reference}`}
                            width={640}
                            height={288}
                            unoptimized
                            className="border-border max-h-72 w-auto rounded-xl border object-contain"
                        />
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

                        {(dpp?.certifications ?? []).length > 0 && (
                            <div className="space-y-1">
                                <p className="text-muted-foreground text-[11px] uppercase tracking-wider">Certifications</p>
                                <div className="flex flex-wrap gap-2">
                                    {(dpp?.certifications ?? []).map((cert, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs">
                                            {cert.customName ?? cert.name}
                                            {cert.licenseNumber && <span className="text-muted-foreground ml-1">#{cert.licenseNumber}</span>}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(dpp?.materials ?? passport.materials).length === 0
                            && (dpp?.careInstructions ?? []).length === 0
                            && (dpp?.certifications ?? []).length === 0 && (
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
