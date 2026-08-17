'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';
import { mockPassportById } from '@lumiris/mock-data';
import type { IrisGrade, ScoreResult } from '@lumiris/types';
import { useApiClient } from '@lumiris/api-client/react';
import { useAuthHydrated } from '@/lib/use-auth';
import type { DppFormDto } from '@lumiris/api-client';
import { fiberLabel } from '@lumiris/scoring-ui';
import { LumirisLogo } from '@lumiris/ui/components/logo';
import { PrintMessage } from '@/features/print-message';
import { draftToPassport, useDraftStore } from '@/lib/draft-store';
import { publicPassportUrl } from '@/features/passport-detail/access-levels';

interface PageProps {
    params: Promise<{ id: string }>;
}

// Échelle de grade Iris de marque (aligne l'impression sur prismatic.css : A=emerald … E=rose).
const GRADE_HEX: Record<IrisGrade, string> = {
    A: '#0f8a50', // lumiris-emerald
    B: '#0e6e88', // lumiris-cyan
    C: '#7b2fe0', // lumiris-iris
    D: '#cf7415', // lumiris-amber
    E: '#c81f45', // lumiris-rose
};

const CARE_SYMBOLS: Array<{ code: string; label: string; svgPath: string }> = [
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

export default function PrintPassportSheetPage({ params }: PageProps) {
    const { id } = use(params);
    const api = useApiClient();
    const hydrated = useAuthHydrated();
    const draft = useDraftStore((s) => s.drafts[id]);
    const fixed = useMemo(() => mockPassportById(id), [id]);

    const [dpp, setDpp] = useState<DppFormDto | null>(null);
    const [score, setScore] = useState<ScoreResult | null>(null);
    const [notFound, setNotFound] = useState(false);

    const mockPassport = useMemo(() => (draft ? draftToPassport(draft) : fixed), [draft, fixed]);
    const isMockOrDraft = Boolean(mockPassport);

    // La fiche s'imprime depuis l'atelier, sur un identifiant de passeport — pas sur un code
    // public. `/public/dpp_forms/{code}` répondait donc 404 sur des passeports pourtant valides.
    // La requête part APRÈS l'hydratation du store d'auth : sans en-tête Authorization, l'API
    // répond 401 et la page conclut à tort à une fiche introuvable.
    useEffect(() => {
        if (isMockOrDraft || !hydrated) return;
        let cancelled = false;
        Promise.all([api.dpp.get(id), api.dpp.getIrisScore(id).catch(() => null)])
            .then(([fetchedDpp, irisScore]) => {
                if (cancelled) return;
                setDpp(fetchedDpp);
                setScore(irisScore);
            })
            .catch(() => {
                if (!cancelled) setNotFound(true);
            });
        return () => {
            cancelled = true;
        };
    }, [id, isMockOrDraft, api, hydrated]);

    useEffect(() => {
        if (!isMockOrDraft && !dpp) return;
        const t = window.setTimeout(() => window.print(), 400);
        return () => window.clearTimeout(t);
    }, [isMockOrDraft, dpp]);

    if (notFound) {
        return (
            <PrintMessage
                title="Fiche introuvable"
                description="Cet identifiant ne correspond à aucun passeport de votre atelier."
                back={{ href: '/passports', label: 'Retour à mes passeports' }}
            />
        );
    }

    if (mockPassport) {
        return <MockPrintSheet productName={mockPassport.garment.name ?? mockPassport.garment.reference} />;
    }

    if (!dpp) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white p-12">
                <p className="font-mono text-sm text-neutral-500">Chargement…</p>
            </div>
        );
    }

    // A draft has no public code yet, so there is no QR to print.
    if (!dpp.publicCode) {
        return (
            <PrintMessage
                title="Brouillon non publié"
                description="Publiez ce passeport pour générer son QR code, puis relancez l'impression."
                back={{ href: `/passports/${id}`, label: 'Retour au passeport' }}
            />
        );
    }

    const dppUrl = publicPassportUrl(dpp.publicCode);
    const gradeHex = score ? (GRADE_HEX[score.grade as IrisGrade] ?? '#6b7280') : '#6b7280';
    const publicDocuments = (dpp.documents ?? []).filter((d) => d.visibility === 'PUBLIC_USERS');

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
                            <div className="mb-1 flex items-center gap-1.5">
                                <LumirisLogo title="" className="h-4 w-auto" />
                                <p className="font-mono text-[11px] tracking-[0.2em] text-neutral-500 uppercase">
                                    LUMIRIS
                                </p>
                            </div>
                            <p className="text-base leading-tight font-semibold">
                                {dpp.productName ?? 'Produit sans nom'}
                            </p>
                            {dpp.sku && <p className="text-xs text-neutral-600">Réf. {dpp.sku}</p>}
                        </div>
                        <div className="text-right">
                            <p className="font-mono text-[10px] tracking-wider text-neutral-500 uppercase">Créé le</p>
                            <p className="font-mono text-xs">{new Date(dpp.createdAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                    </header>

                    {/* Hero — photo + score */}
                    <section className="flex gap-5">
                        <div className="h-[50mm] w-[50mm] shrink-0 overflow-hidden rounded-md border border-neutral-300 bg-neutral-100">
                            {dpp.mainPhotoUrl ? (
                                <Image
                                    src={dpp.mainPhotoUrl}
                                    alt={dpp.productName ?? ''}
                                    width={189}
                                    height={189}
                                    unoptimized
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">
                                    Photo manquante
                                </div>
                            )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                            <div className="space-y-1">
                                <h1 className="text-2xl leading-tight font-semibold">
                                    {dpp.productName ?? 'Sans nom'}
                                </h1>
                                {dpp.productDescription && (
                                    <p className="text-sm text-neutral-600">{dpp.productDescription}</p>
                                )}
                                {dpp.originCountry && (
                                    <p className="text-xs text-neutral-500">Origine : {dpp.originCountry}</p>
                                )}
                            </div>
                            {score && (
                                <div className="flex items-center gap-4 pt-2">
                                    <div
                                        className="flex h-[28mm] w-[28mm] items-center justify-center rounded-md font-mono text-[64px] leading-none font-bold text-white"
                                        style={{ backgroundColor: gradeHex }}
                                    >
                                        {score.grade}
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="font-mono text-[10px] tracking-wider text-neutral-500 uppercase">
                                            Score Iris
                                        </p>
                                        <p className="font-mono text-3xl leading-none font-semibold">
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
                            <h2 className="border-b border-neutral-200 pb-1 text-[11px] font-semibold tracking-wider text-neutral-700 uppercase">
                                Composition
                            </h2>
                            <table className="w-full border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-neutral-300 text-left font-mono text-[10px] tracking-wider text-neutral-500 uppercase">
                                        <th className="py-1.5 pr-2 font-normal">Matière</th>
                                        <th className="py-1.5 pr-2 font-normal">%</th>
                                        <th className="py-1.5 font-normal">Origine</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(dpp.materials ?? []).map((m, i) => (
                                        <tr key={i} className="border-b border-neutral-100">
                                            <td className="py-1.5 pr-2 font-medium">{fiberLabel(m.fiber)}</td>
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
                            <h2 className="border-b border-neutral-200 pb-1 text-[11px] font-semibold tracking-wider text-neutral-700 uppercase">
                                Entretien
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {CARE_SYMBOLS.filter((s) => (dpp.careInstructions ?? []).includes(s.code)).map((s) => (
                                    <div
                                        key={s.code}
                                        className="flex items-center gap-1.5 rounded border border-neutral-200 px-2 py-1 text-[11px]"
                                    >
                                        <Image
                                            src={s.svgPath}
                                            alt=""
                                            aria-hidden
                                            width={16}
                                            height={16}
                                            className="h-4 w-4 shrink-0"
                                        />
                                        {s.label}
                                    </div>
                                ))}
                            </div>
                            {dpp.careNotes && <p className="text-xs text-neutral-600">{dpp.careNotes}</p>}
                        </section>
                    )}

                    {/* Traçabilité */}
                    <section className="space-y-2">
                        <h2 className="border-b border-neutral-200 pb-1 text-[11px] font-semibold tracking-wider text-neutral-700 uppercase">
                            Traçabilité
                        </h2>
                        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                            {dpp.manufacturedAt && (
                                <>
                                    <dt className="text-neutral-500">Date de fabrication</dt>
                                    <dd>{dpp.manufacturedAt}</dd>
                                </>
                            )}
                            {dpp.batchNumber && (
                                <>
                                    <dt className="text-neutral-500">Numéro de lot</dt>
                                    <dd className="font-mono">{dpp.batchNumber}</dd>
                                </>
                            )}
                            {dpp.gtin && (
                                <>
                                    <dt className="text-neutral-500">GTIN</dt>
                                    <dd className="font-mono">{dpp.gtin}</dd>
                                </>
                            )}
                            {dpp.sku && (
                                <>
                                    <dt className="text-neutral-500">SKU</dt>
                                    <dd className="font-mono">{dpp.sku}</dd>
                                </>
                            )}
                            {dpp.reachCompliant != null && (
                                <>
                                    <dt className="text-neutral-500">Conformité REACH</dt>
                                    <dd className="flex items-center gap-1">
                                        {dpp.reachCompliant ? (
                                            <>
                                                <CheckCircle className="h-3 w-3 text-lumiris-emerald" /> Oui
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-3 w-3 text-lumiris-rose" /> Non
                                            </>
                                        )}
                                    </dd>
                                </>
                            )}
                        </dl>
                    </section>

                    {/* Durabilité */}
                    <section className="space-y-2">
                        <h2 className="border-b border-neutral-200 pb-1 text-[11px] font-semibold tracking-wider text-neutral-700 uppercase">
                            Durabilité & Fin de vie
                        </h2>
                        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                            {dpp.recycledPct != null && (
                                <>
                                    <dt className="text-neutral-500">Matières recyclées</dt>
                                    <dd>{dpp.recycledPct} %</dd>
                                </>
                            )}
                            {dpp.warrantyDescription && (
                                <>
                                    <dt className="text-neutral-500">Garantie</dt>
                                    <dd>{dpp.warrantyDescription}</dd>
                                </>
                            )}
                            {dpp.isRepairable != null && (
                                <>
                                    <dt className="text-neutral-500">Réparable</dt>
                                    <dd className="flex items-center gap-1">
                                        {dpp.isRepairable ? (
                                            <>
                                                <CheckCircle className="h-3 w-3 text-lumiris-emerald" /> Oui
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-3 w-3 text-lumiris-rose" /> Non
                                            </>
                                        )}
                                    </dd>
                                </>
                            )}
                            {dpp.endOfLifeInstructions && (
                                <>
                                    <dt className="text-neutral-500">Fin de vie</dt>
                                    <dd>{dpp.endOfLifeInstructions}</dd>
                                </>
                            )}
                        </dl>
                    </section>

                    {/* Documents publics */}
                    {publicDocuments.length > 0 && (
                        <section className="space-y-2">
                            <h2 className="border-b border-neutral-200 pb-1 text-[11px] font-semibold tracking-wider text-neutral-700 uppercase">
                                Documents
                            </h2>
                            <ul className="space-y-0.5 text-xs">
                                {publicDocuments.map((d, i) => (
                                    <li key={d.fileId ?? i}>
                                        {DOC_TYPE_LABELS[d.documentType ?? ''] ?? d.documentType} — {d.filename}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Pied de page — QR code */}
                    <footer className="mt-auto flex items-end justify-between gap-4 border-t border-neutral-300 pt-4">
                        <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-[10px] text-neutral-600 italic">
                                Passeport conforme ESPR. Vérifiable sur lumiris.fr.
                            </p>
                            <p className="font-mono text-[9px] text-neutral-700">{dppUrl}</p>
                            <p className="font-mono text-[10px] font-semibold text-neutral-800">
                                Code : {dpp.publicCode}
                            </p>
                        </div>
                        <div className="shrink-0 rounded-md border border-neutral-300 bg-white p-1.5">
                            <QRCodeCanvas value={dppUrl} size={96} level="M" />
                        </div>
                    </footer>
                </article>
            </div>
        </>
    );
}

function MockPrintSheet({ productName }: { productName: string }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-white p-12">
            <div className="space-y-3 text-center">
                <p className="font-mono text-sm text-neutral-700">{productName}</p>
                <p className="text-xs text-neutral-500">Aperçu disponible uniquement pour les passeports publiés.</p>
            </div>
        </div>
    );
}
