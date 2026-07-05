'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';
import { mockPassportById } from '@lumiris/mock-data';
import type { IrisGrade } from '@lumiris/types';
import { draftToPassport, useDraftStore } from '@/lib/draft-store';
import { fetchPublicDppForm, type DppFormDto, type IrisScoreDto } from '@/lib/dpp-api';

interface PageProps {
    params: Promise<{ id: string }>;
}

const GRADE_HEX: Record<IrisGrade, string> = {
    A: '#10a37f',
    B: '#0891b2',
    C: '#d97706',
    D: '#ea580c',
    E: '#e11d48',
};

const FIBER_LABEL_FR: Record<string, string> = {
    cotton: 'Coton', wool: 'Laine', linen: 'Lin', silk: 'Soie',
    hemp: 'Chanvre', cashmere: 'Cachemire', leather: 'Cuir',
    'recycled-polyester': 'Polyester recyclé', other: 'Autre',
};

const CARE_SYMBOLS: { code: string; label: string; svgPath: string }[] = [
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

const MOBILE_URL = process.env.NEXT_PUBLIC_MOBILE_URL ?? 'http://localhost:3002';

export default function PrintPassportSheetPage({ params }: PageProps) {
    const { id } = use(params);
    const draft = useDraftStore((s) => s.drafts[id]);
    const fixed = useMemo(() => mockPassportById(id), [id]);

    const [dpp, setDpp] = useState<DppFormDto | null>(null);
    const [score, setScore] = useState<IrisScoreDto | null>(null);
    const [notFound, setNotFound] = useState(false);

    const isMockOrDraft = Boolean(draft ?? fixed);

    useEffect(() => {
        if (isMockOrDraft) return;
        fetchPublicDppForm(id)
            .then(({ dpp: fetchedDpp, irisScore }) => {
                setDpp(fetchedDpp);
                setScore(irisScore);
            })
            .catch(() => setNotFound(true));
    }, [id, isMockOrDraft]);

    useEffect(() => {
        if (!isMockOrDraft && !dpp) return;
        const t = window.setTimeout(() => window.print(), 400);
        return () => window.clearTimeout(t);
    }, [isMockOrDraft, dpp]);

    if (notFound) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white p-12">
                <p className="font-mono text-sm text-neutral-700">Fiche introuvable.</p>
            </div>
        );
    }

    if (isMockOrDraft) {
        const passport = draft ? draftToPassport(draft) : fixed!;
        return <MockPrintSheet passportId={id} productName={passport.garment.name ?? passport.garment.reference} />;
    }

    if (!dpp) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white p-12">
                <p className="font-mono text-sm text-neutral-500">Chargement…</p>
            </div>
        );
    }

    const dppUrl = `${MOBILE_URL}/p/${dpp.publicCode}`;
    const gradeHex = score ? (GRADE_HEX[score.grade as IrisGrade] ?? '#6b7280') : '#6b7280';

    return (
        <>
            <style>{`
                @page { size: A4 portrait; margin: 0; }
                html, body { background: #ffffff; }
                @media print { html, body { margin: 0; padding: 0; } .lumiris-sheet { box-shadow: none !important; } }
                .lumiris-sheet, .lumiris-sheet * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            `}</style>

            <div className="flex min-h-screen items-start justify-center bg-neutral-100 print:bg-white">
                <article
                    className="lumiris-sheet relative box-border flex min-h-[297mm] w-[210mm] flex-col gap-6 bg-white p-12 text-neutral-900 shadow-md print:m-0 print:p-12 print:shadow-none"
                    style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
                >
                    {/* En-tête */}
                    <header className="flex items-start justify-between border-b border-neutral-300 pb-3">
                        <div className="space-y-0.5">
                            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500">LUMIRIS</p>
                            <p className="text-base font-semibold leading-tight">{dpp.productName ?? 'Produit sans nom'}</p>
                            {dpp.sku && <p className="text-xs text-neutral-600">Réf. {dpp.sku}</p>}
                        </div>
                        <div className="text-right">
                            <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">Créé le</p>
                            <p className="font-mono text-xs">{new Date(dpp.createdAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                    </header>

                    {/* Hero — photo + score */}
                    <section className="flex gap-5">
                        <div className="h-[50mm] w-[50mm] shrink-0 overflow-hidden rounded-md border border-neutral-300 bg-neutral-100">
                            {dpp.mainPhotoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={dpp.mainPhotoUrl} alt={dpp.productName ?? ''} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">Photo manquante</div>
                            )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                            <div className="space-y-1">
                                <h1 className="text-2xl font-semibold leading-tight">{dpp.productName ?? 'Sans nom'}</h1>
                                {dpp.productDescription && <p className="text-sm text-neutral-600">{dpp.productDescription}</p>}
                                {dpp.originCountry && <p className="text-xs text-neutral-500">Origine : {dpp.originCountry}</p>}
                            </div>
                            {score && (
                                <div className="flex items-center gap-4 pt-2">
                                    <div
                                        className="flex h-[28mm] w-[28mm] items-center justify-center rounded-md font-mono text-[64px] font-bold leading-none text-white"
                                        style={{ backgroundColor: gradeHex }}
                                    >
                                        {score.grade}
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">Score Iris</p>
                                        <p className="font-mono text-3xl font-semibold leading-none">
                                            {score.total.toFixed(1)}
                                            <span className="ml-0.5 text-sm font-normal text-neutral-500">/ 100</span>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Composition */}
                    {(dpp.materials ?? []).length > 0 && (
                        <section className="space-y-2">
                            <h2 className="border-b border-neutral-200 pb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-700">Composition</h2>
                            <table className="w-full border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-neutral-300 text-left font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                                        <th className="py-1.5 pr-2 font-normal">Matière</th>
                                        <th className="py-1.5 pr-2 font-normal">%</th>
                                        <th className="py-1.5 font-normal">Origine</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(dpp.materials ?? []).map((m, i) => (
                                        <tr key={i} className="border-b border-neutral-100">
                                            <td className="py-1.5 pr-2 font-medium">{FIBER_LABEL_FR[m.fiber] ?? m.fiber}</td>
                                            <td className="py-1.5 pr-2 font-mono">{m.percentage}%</td>
                                            <td className="py-1.5">{m.originCountry || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>
                    )}

                    {/* Entretien */}
                    {(dpp.careInstructions ?? []).length > 0 && (
                        <section className="space-y-2">
                            <h2 className="border-b border-neutral-200 pb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-700">Entretien</h2>
                            <div className="flex flex-wrap gap-2">
                                {CARE_SYMBOLS.filter((s) => (dpp.careInstructions ?? []).includes(s.code)).map((s) => (
                                    <div key={s.code} className="flex items-center gap-1.5 rounded border border-neutral-200 px-2 py-1 text-[11px]">
                                        <Image src={s.svgPath} alt="" aria-hidden width={16} height={16} className="h-4 w-4 shrink-0" />
                                        {s.label}
                                    </div>
                                ))}
                            </div>
                            {dpp.careNotes && <p className="text-xs text-neutral-600">{dpp.careNotes}</p>}
                        </section>
                    )}

                    {/* Traçabilité */}
                    <section className="space-y-2">
                        <h2 className="border-b border-neutral-200 pb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-700">Traçabilité</h2>
                        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                            {dpp.manufacturedAt && <><dt className="text-neutral-500">Date de fabrication</dt><dd>{dpp.manufacturedAt}</dd></>}
                            {dpp.batchNumber && <><dt className="text-neutral-500">Numéro de lot</dt><dd className="font-mono">{dpp.batchNumber}</dd></>}
                            {dpp.gtin && <><dt className="text-neutral-500">GTIN</dt><dd className="font-mono">{dpp.gtin}</dd></>}
                            {dpp.sku && <><dt className="text-neutral-500">SKU</dt><dd className="font-mono">{dpp.sku}</dd></>}
                            {dpp.reachCompliant != null && (
                                <>
                                    <dt className="text-neutral-500">Conformité REACH</dt>
                                    <dd className="flex items-center gap-1">
                                        {dpp.reachCompliant
                                            ? <><CheckCircle className="h-3 w-3 text-green-600" /> Oui</>
                                            : <><XCircle className="h-3 w-3 text-red-500" /> Non</>}
                                    </dd>
                                </>
                            )}
                        </dl>
                    </section>

                    {/* Durabilité */}
                    <section className="space-y-2">
                        <h2 className="border-b border-neutral-200 pb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-700">Durabilité & Fin de vie</h2>
                        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                            {dpp.recycledPct != null && <><dt className="text-neutral-500">Matières recyclées</dt><dd>{dpp.recycledPct} %</dd></>}
                            {dpp.warrantyDescription && <><dt className="text-neutral-500">Garantie</dt><dd>{dpp.warrantyDescription}</dd></>}
                            {dpp.isRepairable != null && (
                                <>
                                    <dt className="text-neutral-500">Réparable</dt>
                                    <dd className="flex items-center gap-1">
                                        {dpp.isRepairable
                                            ? <><CheckCircle className="h-3 w-3 text-green-600" /> Oui</>
                                            : <><XCircle className="h-3 w-3 text-red-500" /> Non</>}
                                    </dd>
                                </>
                            )}
                            {dpp.endOfLifeInstructions && <><dt className="text-neutral-500">Fin de vie</dt><dd>{dpp.endOfLifeInstructions}</dd></>}
                        </dl>
                    </section>

                    {/* Documents publics */}
                    {(dpp.documents ?? []).filter((d) => d.visibility === 'PUBLIC_USERS').length > 0 && (
                        <section className="space-y-2">
                            <h2 className="border-b border-neutral-200 pb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-700">Documents</h2>
                            <ul className="space-y-0.5 text-xs">
                                {(dpp.documents ?? [])
                                    .filter((d) => d.visibility === 'PUBLIC_USERS')
                                    .map((d) => (
                                        <li key={d.fileId}>{DOC_TYPE_LABELS[d.documentType] ?? d.documentType} — {d.filename}</li>
                                    ))}
                            </ul>
                        </section>
                    )}

                    {/* Pied de page — QR code */}
                    <footer className="mt-auto flex items-end justify-between gap-4 border-t border-neutral-300 pt-4">
                        <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-[10px] italic text-neutral-600">Passeport conforme ESPR. Vérifiable sur lumiris.fr.</p>
                            <p className="font-mono text-[9px] text-neutral-700">{dppUrl}</p>
                            <p className="font-mono text-[10px] font-semibold text-neutral-800">Code : {dpp.publicCode}</p>
                        </div>
                        <div className="shrink-0 rounded-md border border-neutral-300 bg-white p-1.5">
                            <QRCodeCanvas value={dppUrl} size={96} includeMargin={false} level="M" />
                        </div>
                    </footer>
                </article>
            </div>
        </>
    );
}

function MockPrintSheet({ passportId, productName }: { passportId: string; productName: string }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-white p-12">
            <div className="space-y-3 text-center">
                <p className="font-mono text-sm text-neutral-700">{productName}</p>
                <p className="text-xs text-neutral-500">Aperçu disponible uniquement pour les passeports publiés.</p>
            </div>
        </div>
    );
}
