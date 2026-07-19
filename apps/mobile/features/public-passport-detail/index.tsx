'use client';

import { type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, FileText, ArrowLeft, Download, Heart, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { IrisGrade } from '@lumiris/types';
import { cn } from '@lumiris/ui/lib/cn';
import type { DppEventDto, DppEventActorType, DppFormDto, IrisScoreDto } from '@/lib/public-dpp-api';
import { addPublicDpp, removePublicDpp, useWardrobe } from '@/lib/wardrobe-storage';
import { toast } from '@/lib/toast';
import { GRADE_TEXT, GRADE_BORDER, GRADE_BG_SOFT, GRADE_CSS_VAR } from '@/features/passport-detail/grade-classes';

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

const CATEGORY_LABELS: Record<string, string> = {
    top: 'Haut',
    bottom: 'Bas',
    dress: 'Robe / Combinaison',
    outerwear: 'Veste / Manteau',
    shoe: 'Chaussure',
    accessory: 'Accessoire',
    other: 'Autre',
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

const ACTOR_LABELS: Record<DppEventActorType, string> = {
    MANUFACTURER: 'Fabricant',
    DISTRIBUTOR: 'Distributeur',
    RETAILER: 'Revendeur',
    CONSUMER: 'Consommateur',
    REPAIRER: 'Réparateur',
    RECYCLER: 'Recycleur',
};

const LAYER_DELAY = 0.12;

interface PublicPassportDetailProps {
    dpp: DppFormDto;
    irisScore: IrisScoreDto | null;
    events?: DppEventDto[];
    artisanSlug?: string | null;
}

export function PublicPassportDetail({
    dpp,
    irisScore,
    events = [],
    artisanSlug,
}: PublicPassportDetailProps) {
    const router = useRouter();
    const grade = irisScore?.grade as IrisGrade | undefined;
    const cssVar = grade ? GRADE_CSS_VAR[grade] : 'var(--color-lumiris-iris)';

    const wardrobe = useWardrobe();
    const isSaved = wardrobe.some((it) => it.kind === 'public-dpp' && it.publicCode === dpp.publicCode);

    const onToggleSaved = () => {
        if (isSaved) {
            removePublicDpp(dpp.publicCode);
            toast.info('Retiré de ta garde-robe');
        } else {
            addPublicDpp({
                publicCode: dpp.publicCode,
                productName: dpp.productName ?? 'Produit sans nom',
                grade: irisScore?.grade,
            });
            toast.success('Ajouté à ta garde-robe');
        }
    };

    const publicDocs = (dpp.documents ?? []).filter((d) => d.visibility === 'PUBLIC_USERS');

    return (
        <div className="bg-background flex h-full w-full flex-col overflow-y-auto pb-10">
            {/* Hero score */}
            <header className="relative flex h-56 shrink-0 items-center justify-center overflow-hidden">
                {grade && (
                    <motion.div
                        aria-hidden
                        className="pointer-events-none absolute h-64 w-64 rounded-full blur-[80px]"
                        style={{ background: cssVar }}
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.25 }}
                        transition={{ duration: 0.9, delay: 0.1 }}
                    />
                )}

                <button
                    type="button"
                    onClick={() => router.back()}
                    aria-label="Retour"
                    className="bg-card/70 absolute left-4 top-12 inline-flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md"
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                </button>

                <button
                    type="button"
                    onClick={onToggleSaved}
                    aria-label={isSaved ? 'Retirer de ma garde-robe' : 'Ajouter à ma garde-robe'}
                    aria-pressed={isSaved}
                    className={cn(
                        'absolute right-4 top-12 inline-flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-colors',
                        isSaved ? 'bg-lumiris-rose/15 text-lumiris-rose' : 'bg-card/70 text-foreground',
                    )}
                >
                    <Heart className={cn('h-4 w-4', isSaved && 'fill-current')} aria-hidden />
                </button>

                <div className="relative z-10 flex flex-col items-center gap-3">
                    {grade ? (
                        <motion.div
                            className={cn(
                                'flex h-24 w-24 items-center justify-center rounded-full border-2 font-mono text-[56px] font-bold leading-none',
                                GRADE_BORDER[grade],
                                GRADE_TEXT[grade],
                                GRADE_BG_SOFT[grade],
                            )}
                            style={{ boxShadow: `0 0 50px -10px ${cssVar}` }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.15 }}
                        >
                            {grade}
                        </motion.div>
                    ) : (
                        <div className="bg-muted flex h-24 w-24 items-center justify-center rounded-full">
                            <span className="text-muted-foreground text-[10px]">—</span>
                        </div>
                    )}

                    <motion.div
                        className="flex flex-col items-center gap-0.5 text-center"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                    >
                        {irisScore && (
                            <p className={cn('font-mono text-xs font-semibold', grade ? GRADE_TEXT[grade] : '')}>
                                {irisScore.total.toFixed(1)} / 100
                            </p>
                        )}
                        <p className="text-foreground text-sm font-semibold">{dpp.productName ?? 'Produit sans nom'}</p>
                        {dpp.sku && <p className="text-muted-foreground text-xs">Réf. {dpp.sku}</p>}
                    </motion.div>
                </div>
            </header>

            <div className="flex flex-col gap-5 px-4">
                {/* Produit */}
                <Section delay={LAYER_DELAY * 1} title="Le Produit">
                    {dpp.mainPhotoUrl && (
                        <div className="border-border mx-auto w-1/2 overflow-hidden rounded-xl border">
                            <Image
                                src={dpp.mainPhotoUrl}
                                alt={dpp.productName ?? 'Photo produit'}
                                width={240}
                                height={240}
                                unoptimized
                                className="aspect-square w-full object-contain"
                            />
                        </div>
                    )}
                    <div className="grid gap-2.5 sm:grid-cols-2">
                        {dpp.productDescription && (
                            <InfoRow label="Description" value={dpp.productDescription} fullWidth />
                        )}
                        <InfoRow
                            label="Catégorie"
                            value={CATEGORY_LABELS[dpp.productCategory ?? ''] ?? dpp.productCategory}
                        />
                        <InfoRow label="Pays d'origine" value={dpp.originCountry} />
                        {(dpp.availableSizes ?? []).length > 0 && (
                            <InfoRow
                                label="Tailles"
                                value={
                                    <div className="flex flex-wrap gap-1 pt-0.5">
                                        {(dpp.availableSizes ?? []).map((s) => (
                                            <span
                                                key={s}
                                                className="bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 text-xs"
                                            >
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                }
                            />
                        )}
                        {(dpp.colors ?? []).length > 0 && (
                            <InfoRow
                                label="Couleurs"
                                value={
                                    <div className="flex flex-wrap gap-1 pt-0.5">
                                        {(dpp.colors ?? []).map((c) => (
                                            <span
                                                key={c}
                                                className="border-border rounded border px-1.5 py-0.5 text-xs"
                                            >
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                }
                            />
                        )}
                    </div>
                </Section>

                {/* Artisan */}
                {artisanSlug && (
                    <Link
                        href={`/artisans/${artisanSlug}`}
                        className="border-border bg-card hover:bg-muted/40 flex items-center justify-between rounded-2xl border p-4 transition-colors"
                    >
                        <span className="text-foreground text-sm font-semibold">Voir la vitrine de l&apos;artisan</span>
                        <ExternalLink className="text-muted-foreground h-4 w-4" />
                    </Link>
                )}

                {/* Composition & Entretien */}
                {((dpp.materials ?? []).length > 0 || (dpp.careInstructions ?? []).length > 0 || dpp.careNotes) && (
                    <Section delay={LAYER_DELAY * 2} title="Composition & Entretien">
                        {(dpp.materials ?? []).length > 0 && (
                            <div className="space-y-1">
                                <Label>Matières</Label>
                                {(dpp.materials ?? []).map((m, i) => (
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
                        {(dpp.careInstructions ?? []).length > 0 && (
                            <div className="space-y-1.5">
                                <Label>Instructions d&apos;entretien</Label>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {CARE_SYMBOLS.filter((s) => (dpp.careInstructions ?? []).includes(s.code)).map(
                                        (s) => (
                                            <div
                                                key={s.code}
                                                className="border-border flex items-center gap-2 rounded-lg border px-2.5 py-2"
                                            >
                                                <Image
                                                    src={s.svgPath}
                                                    alt=""
                                                    aria-hidden
                                                    width={20}
                                                    height={20}
                                                    className="h-5 w-5 shrink-0"
                                                />
                                                <span className="text-foreground truncate text-xs">{s.label}</span>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        )}
                        {dpp.careNotes && (
                            <div>
                                <Label>Notes</Label>
                                <p className="text-foreground whitespace-pre-wrap text-sm">{dpp.careNotes}</p>
                            </div>
                        )}
                    </Section>
                )}

                {/* Traçabilité */}
                <Section delay={LAYER_DELAY * 3} title="Traçabilité">
                    <div className="grid gap-2.5 sm:grid-cols-2">
                        <InfoRow label="Date de fabrication" value={dpp.manufacturedAt} />
                        <InfoRow label="Numéro de lot" value={dpp.batchNumber} />
                        <InfoRow label="GTIN" value={dpp.gtin} />
                        <InfoRow label="SKU" value={dpp.sku} />
                        {dpp.reachCompliant != null && (
                            <InfoRow label="Conformité REACH" value={<BooleanField value={dpp.reachCompliant} />} />
                        )}
                    </div>
                </Section>

                {/* Durabilité */}
                <Section delay={LAYER_DELAY * 4} title="Durabilité & Fin de vie">
                    <div className="grid gap-2.5 sm:grid-cols-2">
                        <InfoRow
                            label="Matières recyclées"
                            value={dpp.recycledPct != null ? `${dpp.recycledPct} %` : null}
                        />
                        <InfoRow label="Garantie" value={dpp.warrantyDescription} />
                        {dpp.isRepairable != null && (
                            <InfoRow label="Réparable" value={<BooleanField value={dpp.isRepairable} />} />
                        )}
                        <InfoRow label="Instructions fin de vie" value={dpp.endOfLifeInstructions} />
                    </div>
                </Section>

                {/* Documents publics */}
                {publicDocs.length > 0 && (
                    <Section delay={LAYER_DELAY * 5} title="Documents publics">
                        <div className="space-y-1.5">
                            {publicDocs.map((doc) => (
                                <div
                                    key={doc.fileId}
                                    className="border-border flex items-center gap-2.5 rounded-xl border px-3 py-2.5"
                                >
                                    <FileText className="text-muted-foreground h-4 w-4 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-foreground truncate text-sm font-medium">{doc.filename}</p>
                                        <p className="text-muted-foreground truncate text-[11px]">
                                            {DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType}
                                        </p>
                                    </div>
                                    <a
                                        href={doc.url}
                                        download={doc.filename}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`Télécharger ${doc.filename}`}
                                        className="border-border bg-card text-foreground hover:bg-muted/40 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors active:scale-95"
                                    >
                                        <Download className="h-3.5 w-3.5" aria-hidden />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {events.length > 0 && (
                    <Section delay={LAYER_DELAY * 6} title="Historique">
                        <ol className="space-y-0">
                            {events.map((event, i) => (
                                <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
                                    <div className="flex flex-col items-center">
                                        <span className="bg-foreground/70 mt-1.5 h-2 w-2 shrink-0 rounded-full" />
                                        {i < events.length - 1 && <span className="bg-border w-px flex-1" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground text-[11px] uppercase tracking-wider">
                                                {new Date(event.occurredAt).toLocaleDateString('fr-FR')}
                                            </span>
                                            <span className="bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 text-[10px]">
                                                {ACTOR_LABELS[event.actorType]}
                                            </span>
                                        </div>
                                        <p className="text-foreground text-sm">{event.description}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </Section>
                )}

                <p className="text-muted-foreground mt-2 border-t pt-4 font-mono text-[10px] leading-relaxed">
                    Code : {dpp.publicCode} / {new Date(dpp.createdAt).toLocaleDateString('fr-FR')}
                </p>
            </div>
        </div>
    );
}

function Section({ delay, title, children }: { delay: number; title: string; children: ReactNode }) {
    return (
        <motion.section
            className="border-border bg-card space-y-3 rounded-2xl border p-4"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            <h2 className="text-foreground text-xs font-semibold uppercase tracking-[0.18em]">{title}</h2>
            {children}
        </motion.section>
    );
}

function Label({ children }: { children: ReactNode }) {
    return <p className="text-muted-foreground text-[11px] uppercase tracking-wider">{children}</p>;
}

function InfoRow({ label, value, fullWidth }: { label: string; value: ReactNode; fullWidth?: boolean }) {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className={cn('flex flex-col gap-0.5', fullWidth && 'col-span-full')}>
            <Label>{label}</Label>
            <span className="text-foreground text-sm">{value}</span>
        </div>
    );
}

function BooleanField({ value }: { value: boolean }) {
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
