'use client';

import Link from 'next/link';
import { use } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { mockSuppliers } from '@lumiris/mock-data';
import { FIBER_LABEL, GARMENT_KIND_LABEL, STAGE_LABEL } from '@lumiris/scoring-ui';
import type { Artisan, IrisGrade, Material, Passport, ProductionStep } from '@lumiris/types';
import { flagEmoji, formatDateFr } from '@lumiris/utils';
import { usePassportSource } from '@/lib/use-passport-source';
import { useAutoPrint } from '@/lib/use-auto-print';

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

export default function PrintPassportSheetPage({ params }: PageProps) {
    const { id } = use(params);
    const { passport, artisan, score } = usePassportSource(id);

    const printable = Boolean(passport) && passport?.status !== 'Draft';
    useAutoPrint(printable);

    if (!passport || !artisan || !score) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white p-12">
                <div className="space-y-3 text-center">
                    <p className="font-mono text-sm text-neutral-700">Fiche introuvable.</p>
                    <Link
                        href="/passports"
                        className="inline-block text-xs text-neutral-600 underline underline-offset-2"
                    >
                        Retour à la liste
                    </Link>
                </div>
            </div>
        );
    }

    if (passport.status === 'Draft') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white p-12">
                <div className="max-w-sm space-y-3 text-center">
                    <p className="font-mono text-sm text-neutral-900">Brouillon non publié</p>
                    <p className="text-xs text-neutral-600">
                        Une fiche officielle ne peut être imprimée qu&apos;à partir d&apos;un passeport publié ou en
                        complétion.
                    </p>
                    <Link
                        href={`/passports/${passport.id}`}
                        className="inline-block text-xs text-neutral-700 underline underline-offset-2"
                    >
                        Retour au passeport
                    </Link>
                </div>
            </div>
        );
    }

    const kindLabel = GARMENT_KIND_LABEL[passport.garment.kind];
    const issuedAt = new Date(passport.publishedAt ?? passport.updatedAt);
    const gradeHex = GRADE_HEX[score.grade];

    return (
        <>
            <style>{`
                @page { size: A4 portrait; margin: 0; }
                html, body { background: #ffffff; }
                @media print {
                    html, body { margin: 0; padding: 0; }
                    .lumiris-sheet { box-shadow: none !important; }
                }
                .lumiris-sheet, .lumiris-sheet * {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            `}</style>

            <div className="flex min-h-screen items-start justify-center bg-neutral-100 print:bg-white">
                <article
                    className="lumiris-sheet relative box-border flex min-h-[297mm] w-[210mm] flex-col gap-6 bg-white p-12 text-neutral-900 shadow-md print:m-0 print:p-12 print:shadow-none"
                    style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
                >
                    <Header artisan={artisan} issuedAt={issuedAt} />

                    <Hero
                        passport={passport}
                        kindLabel={kindLabel}
                        grade={score.grade}
                        total={score.total}
                        gradeHex={gradeHex}
                    />

                    <CompositionBlock materials={passport.materials} />

                    <StepsBlock steps={passport.steps} />

                    <CertsAndWarrantyBlock passport={passport} />

                    <Footer passport={passport} />
                </article>
            </div>
        </>
    );
}

function Header({ artisan, issuedAt }: { artisan: Artisan; issuedAt: Date }) {
    return (
        <header className="flex items-start justify-between border-b border-neutral-300 pb-3">
            <div className="space-y-0.5">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500">LUMIRIS</p>
                <p className="text-base font-semibold leading-tight">{artisan.atelierName || artisan.displayName}</p>
                <p className="text-xs text-neutral-600">
                    {artisan.displayName}
                    {artisan.city ? ` · ${artisan.city}` : ''}
                </p>
            </div>
            <div className="text-right">
                <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">Émis le</p>
                <p className="font-mono text-xs">{formatDateFr(issuedAt)}</p>
            </div>
        </header>
    );
}

function Hero({
    passport,
    kindLabel,
    grade,
    total,
    gradeHex,
}: {
    passport: Passport;
    kindLabel: string;
    grade: IrisGrade;
    total: number;
    gradeHex: string;
}) {
    return (
        <section className="flex gap-5">
            <div className="h-[50mm] w-[50mm] shrink-0 overflow-hidden rounded-md border border-neutral-300 bg-neutral-100">
                {passport.garment.mainPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={passport.garment.mainPhotoUrl}
                        alt={`${kindLabel} ${passport.garment.reference}`}
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
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">{kindLabel}</p>
                    <h1 className="text-2xl font-semibold leading-tight">
                        {passport.garment.reference || 'Pièce sans référence'}
                    </h1>
                    {passport.garment.retailPrice > 0 && (
                        <p className="text-base font-semibold">
                            {passport.garment.retailPrice} {passport.garment.currency}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-4 pt-2">
                    <div
                        className="flex h-[28mm] w-[28mm] items-center justify-center rounded-md font-mono text-[64px] font-bold leading-none text-white"
                        style={{ backgroundColor: gradeHex }}
                        role="img"
                        aria-label={`Iris grade ${grade}`}
                    >
                        {grade}
                    </div>
                    <div className="space-y-0.5">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">Score Iris</p>
                        <p className="font-mono text-3xl font-semibold leading-none">
                            {total.toFixed(1)}
                            <span className="ml-0.5 text-sm font-normal text-neutral-500">/ 100</span>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

function CompositionBlock({ materials }: { materials: readonly Material[] }) {
    if (materials.length === 0) {
        return (
            <BlockTitled title="Composition">
                <p className="text-xs text-neutral-500">Composition non renseignée.</p>
            </BlockTitled>
        );
    }
    return (
        <BlockTitled title="Composition">
            <table className="w-full border-collapse text-xs">
                <thead>
                    <tr className="border-b border-neutral-300 text-left font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                        <th className="py-1.5 pr-2 font-normal">Matière</th>
                        <th className="py-1.5 pr-2 font-normal">%</th>
                        <th className="py-1.5 pr-2 font-normal">Origine</th>
                        <th className="py-1.5 pr-2 font-normal">Fournisseur</th>
                        <th className="py-1.5 font-normal">Certifs</th>
                    </tr>
                </thead>
                <tbody>
                    {materials.map((m, i) => {
                        const supplier = mockSuppliers.find((s) => s.id === m.supplierId);
                        const supplierName = supplier?.name ?? m.supplierId ?? '—';
                        const flag = flagEmoji(m.originCountry);
                        return (
                            <tr key={i} className="border-b border-neutral-100 align-top">
                                <td className="py-1.5 pr-2 font-medium">{FIBER_LABEL[m.fiber]}</td>
                                <td className="py-1.5 pr-2 font-mono">{m.percentage}%</td>
                                <td className="py-1.5 pr-2">
                                    {flag ? `${flag} ` : ''}
                                    {m.originCountry || '—'}
                                </td>
                                <td className="py-1.5 pr-2 text-neutral-700">{supplierName}</td>
                                <td className="py-1.5">
                                    {m.certifications.length === 0 ? (
                                        <span className="text-neutral-400">—</span>
                                    ) : (
                                        <span className="inline-flex flex-wrap gap-1">
                                            {m.certifications.map((c) => (
                                                <span
                                                    key={c.id}
                                                    className="rounded border border-neutral-300 px-1.5 py-0.5 font-mono text-[9px]"
                                                >
                                                    {c.kind === 'CUSTOM' && c.customName ? c.customName : c.kind}
                                                </span>
                                            ))}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </BlockTitled>
    );
}

function StepsBlock({ steps }: { steps: readonly ProductionStep[] }) {
    if (steps.length === 0) {
        return (
            <BlockTitled title="Étapes de fabrication">
                <p className="text-xs text-neutral-500">Aucune étape renseignée.</p>
            </BlockTitled>
        );
    }
    return (
        <BlockTitled title="Étapes de fabrication">
            <ol className="space-y-1.5">
                {steps.map((s, i) => (
                    <li key={s.id} className="flex gap-3 text-xs">
                        <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-neutral-400 font-mono text-[9px]">
                            {i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="font-medium">{STAGE_LABEL[s.kind]}</span>
                            {s.label && <span className="text-neutral-700"> — {s.label}</span>}
                            <span className="block text-neutral-500">
                                {s.performedBy ? `${s.performedBy} · ` : ''}
                                {s.locationCity}
                                {s.locationCountry ? ` (${s.locationCountry})` : ''}
                            </span>
                        </span>
                    </li>
                ))}
            </ol>
        </BlockTitled>
    );
}

function CertsAndWarrantyBlock({ passport }: { passport: Passport }) {
    const months = passport.warranty.durationMonths;
    return (
        <BlockTitled title="Certificats &amp; garantie">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">Certifications</p>
                    {passport.certifications.length === 0 ? (
                        <p className="mt-1 text-xs text-neutral-500">Aucune.</p>
                    ) : (
                        <ul className="mt-1 space-y-0.5 text-xs">
                            {passport.certifications.map((c) => (
                                <li key={c.id}>
                                    <span className="font-mono">
                                        {c.kind === 'CUSTOM' && c.customName ? c.customName : c.kind}
                                    </span>
                                    {c.issuer && <span className="text-neutral-600"> · {c.issuer}</span>}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">Garantie</p>
                    {months > 0 ? (
                        <>
                            <p className="mt-1 text-xs font-semibold">
                                {Math.round(months / 12) || months / 12} an
                                {months >= 24 ? 's' : ''} ({months} mois)
                            </p>
                            {passport.warranty.terms && (
                                <p className="mt-1 text-xs text-neutral-700">{passport.warranty.terms}</p>
                            )}
                            {passport.warranty.repairabilityCommitment && (
                                <p className="mt-1 text-[11px] italic text-neutral-600">
                                    {passport.warranty.repairabilityCommitment}
                                </p>
                            )}
                        </>
                    ) : (
                        <p className="mt-1 text-xs text-neutral-500">Non renseignée.</p>
                    )}
                </div>
            </div>
        </BlockTitled>
    );
}

function Footer({ passport }: { passport: Passport }) {
    return (
        <footer className="mt-auto flex items-end justify-between gap-4 border-t border-neutral-300 pt-4">
            <div className="min-w-0 flex-1 space-y-1">
                <p className="text-[10px] italic text-neutral-600">
                    Passeport conforme ESPR. Vérifiable sur lumiris.fr.
                </p>
                <p className="break-all font-mono text-[9px] text-neutral-700">{passport.gs1.verificationUrl}</p>
            </div>
            <div className="shrink-0 rounded-md border border-neutral-300 bg-white p-1.5">
                <QRCodeCanvas value={passport.gs1.verificationUrl} size={113} includeMargin={false} level="M" />
            </div>
        </footer>
    );
}

function BlockTitled({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-2">
            <h2 className="border-b border-neutral-200 pb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-700">
                {title}
            </h2>
            {children}
        </section>
    );
}
