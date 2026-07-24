import { type ReactNode, lazy, Suspense, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    CheckCircle,
    XCircle,
    FileText,
    ArrowLeft,
    Download,
    Heart,
    ExternalLink,
    ShieldCheck,
    ShoppingBag,
} from 'lucide-react';
import { useMarketplaceProductByDpp } from '@lumiris/api-client/react';
import type { IrisGrade } from '@lumiris/types';
import { cn } from '@lumiris/ui/lib/cn';
import { fiberLabel } from '@lumiris/scoring-ui';
import type { OriginMapOriginPoint, OriginMapStepPoint } from '@lumiris/scoring-ui/components/origin-map';
import { formatCents } from '@/lib/marketplace';
import type { DppAccessLevel, DppEventDto, DppEventActorType, DppFormDto, IrisScoreDto } from '@lumiris/api-client';
import { addPublicDpp, removePublicDpp, useWardrobe } from '@/lib/wardrobe-storage';
import { toast } from '@/lib/toast';
import { GRADE_TEXT, GRADE_BORDER, GRADE_BG_SOFT, GRADE_CSS_VAR } from '@/features/passport-detail/grade-classes';

const OriginMap = lazy(() =>
    import('@lumiris/scoring-ui/components/origin-map').then((m) => ({ default: m.OriginMap })),
);

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

/**
 * Regroupement d'affichage des documents. L'ordre place le public en tête : c'est ce que la
 * plupart des porteurs verront, les blocs élargis n'apparaissant qu'avec le QR correspondant.
 */
const DOC_GROUPS: Array<{ visibility: string; title: string; audience: string }> = [
    { visibility: 'PUBLIC_USERS', title: 'Documents publics', audience: 'Accessibles à tous' },
    {
        visibility: 'CIRCULAR_OPERATORS',
        title: 'Réparation & fin de vie',
        audience: 'Réservés aux réparateurs et recycleurs',
    },
    { visibility: 'AUTHORITIES', title: 'Conformité', audience: 'Réservés aux autorités compétentes' },
];

const ACCESS_BANNERS: Record<string, { title: string; body: string; className: string }> = {
    CIRCULAR_OPERATORS: {
        title: 'Accès réparation',
        body: 'Ce QR ouvre les documents techniques réservés aux réparateurs et recycleurs.',
        className: 'border-lumiris-amber/40 bg-lumiris-amber/5 text-lumiris-amber',
    },
    AUTHORITIES: {
        title: 'Accès autorités',
        body: 'Ce QR ouvre les documents de conformité réservés aux autorités compétentes.',
        className: 'border-lumiris-iris/40 bg-lumiris-iris/5 text-lumiris-iris',
    },
};

interface PublicPassportDetailProps {
    dpp: DppFormDto;
    irisScore?: IrisScoreDto | null;
    events?: DppEventDto[];
    artisanSlug?: string | null;
    accessLevel?: DppAccessLevel | null;
}

export function PublicPassportDetail({
    dpp,
    irisScore,
    events = [],
    artisanSlug,
    accessLevel,
}: PublicPassportDetailProps) {
    const navigate = useNavigate();
    const grade = irisScore?.grade as IrisGrade | undefined;
    const cssVar = grade ? GRADE_CSS_VAR[grade] : 'var(--color-lumiris-iris)';

    // Un brouillon n'a pas de code public. Cette vue n'est atteignable que par scan, donc le cas ne
    // se produit pas — mais la garde-robe s'indexe sur ce code, alors on n'invente rien quand il
    // manque : l'ajout est simplement indisponible.
    const publicCode = dpp.publicCode ?? null;

    const wardrobe = useWardrobe();
    const isSaved =
        publicCode !== null && wardrobe.some((it) => it.kind === 'public-dpp' && it.publicCode === publicCode);

    // Pont scan → achat : si une annonce Boutique publiée est rattachée à ce passeport (par son
    // formId), on propose de l'acheter en direct. Un 404 (aucune annonce) laisse `buyProduct`
    // indéfini → le CTA reste masqué.
    const { data: buyProduct } = useMarketplaceProductByDpp(dpp.id);

    const onToggleSaved = () => {
        if (publicCode === null) return;
        if (isSaved) {
            removePublicDpp(publicCode);
            toast.info('Retiré de ta garde-robe');
        } else {
            addPublicDpp({
                publicCode,
                productName: dpp.productName ?? 'Produit sans nom',
                grade: irisScore?.grade,
            });
            toast.success('Ajouté à ta garde-robe');
        }
    };

    // Le backend ne sert déjà que les documents du périmètre résolu ; ce regroupement est
    // d'affichage, pas de sécurité — il nomme la provenance de chaque bloc.
    const docGroups = DOC_GROUPS.map((group) => ({
        ...group,
        documents: (dpp.documents ?? []).filter((d) => d.visibility === group.visibility),
    })).filter((group) => group.documents.length > 0);

    const banner = accessLevel ? ACCESS_BANNERS[accessLevel] : undefined;

    const originPoints: OriginMapOriginPoint[] = useMemo(
        () =>
            (dpp.materials ?? []).map((m, i) => ({
                id: `material-${i}`,
                label: fiberLabel(m.fiber),
                country: m.originCountry,
                latitude: m.latitude,
                longitude: m.longitude,
            })),
        [dpp.materials],
    );

    const stepPoints: OriginMapStepPoint[] = useMemo(
        () =>
            [...events]
                .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime())
                .map((e, i) => ({
                    id: e.id,
                    order: i + 1,
                    label: e.description,
                    sublabel: ACTOR_LABELS[e.actorType],
                    city: e.locationCity,
                    country: e.locationCountry,
                    latitude: e.latitude,
                    longitude: e.longitude,
                })),
        [events],
    );

    return (
        <div className="bg-background flex h-full w-full flex-col overflow-y-auto pb-28">
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
                    onClick={() => navigate(-1)}
                    aria-label="Retour"
                    className="bg-card/70 absolute left-4 top-12 inline-flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md"
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                </button>

                {/* Sans code public, la garde-robe n'a pas de clé : un bouton muet vaut moins qu'aucun. */}
                {publicCode !== null && (
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
                )}

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
                {/* Le porteur d'un QR élargi doit savoir qu'il voit plus que le grand public. */}
                {banner && (
                    <div className={cn('flex items-start gap-2.5 rounded-2xl border px-3.5 py-3', banner.className)}>
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
                        <div className="min-w-0">
                            <p className="text-[13px] font-semibold">{banner.title}</p>
                            <p className="text-foreground/70 text-[11px] leading-relaxed">{banner.body}</p>
                        </div>
                    </div>
                )}

                {/* Pont scan → achat : visible seulement si une annonce Boutique est publiée. */}
                {buyProduct ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: LAYER_DELAY * 0.5 }}
                    >
                        <Link
                            to={`/boutique/${buyProduct.id}`}
                            className="bg-primary text-primary-foreground flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold shadow-sm transition-opacity active:opacity-90"
                        >
                            <span className="inline-flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                                Acheter cette pièce sur la Boutique
                            </span>
                            <span className="font-mono tabular-nums">{formatCents(buyProduct.priceCents)}</span>
                        </Link>
                    </motion.div>
                ) : null}

                {/* Produit */}
                <Section delay={LAYER_DELAY * 1} title="Le Produit">
                    {dpp.mainPhotoUrl && (
                        <div className="border-border mx-auto w-1/2 overflow-hidden rounded-xl border">
                            <img
                                src={dpp.mainPhotoUrl}
                                alt={dpp.productName ?? 'Photo produit'}
                                width={240}
                                height={240}
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
                        to={`/artisans/${artisanSlug}`}
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
                                        <span className="font-mono">{m.percentage}%</span> {fiberLabel(m.fiber)}
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
                                                <img
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

                {/* Documents, groupés par niveau d'accès */}
                {docGroups.map((group, groupIndex) => (
                    <Section key={group.visibility} delay={LAYER_DELAY * (5 + groupIndex)} title={group.title}>
                        <p className="text-muted-foreground mb-2 text-[11px]">{group.audience}</p>
                        <div className="space-y-1.5">
                            {group.documents.map((doc) => (
                                <div
                                    key={doc.fileId}
                                    className="border-border flex items-center gap-2.5 rounded-xl border px-3 py-2.5"
                                >
                                    <FileText className="text-muted-foreground h-4 w-4 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-foreground truncate text-sm font-medium">
                                            {doc.filename ?? 'Document'}
                                        </p>
                                        <p className="text-muted-foreground truncate text-[11px]">
                                            {DOC_TYPE_LABELS[doc.documentType ?? ''] ?? doc.documentType}
                                        </p>
                                    </div>
                                    <a
                                        href={doc.url ?? undefined}
                                        download={doc.filename ?? undefined}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`Télécharger ${doc.filename ?? 'le document'}`}
                                        className="border-border bg-card text-foreground hover:bg-muted/40 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors active:scale-95"
                                    >
                                        <Download className="h-3.5 w-3.5" aria-hidden />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </Section>
                ))}

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

                {(originPoints.length > 0 || stepPoints.length > 0) && (
                    <Section delay={LAYER_DELAY * 7} title="Origine et parcours">
                        <Suspense fallback={null}>
                            <OriginMap origins={originPoints} steps={stepPoints} />
                        </Suspense>
                    </Section>
                )}

                <p className="text-muted-foreground mt-2 border-t pt-4 font-mono text-[10px] leading-relaxed">
                    {publicCode !== null && `Code : ${publicCode} / `}
                    {new Date(dpp.createdAt).toLocaleDateString('fr-FR')}
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
        <span className="text-lumiris-emerald flex items-center gap-1 text-sm">
            <CheckCircle className="h-3.5 w-3.5" /> Oui
        </span>
    ) : (
        <span className="text-lumiris-rose flex items-center gap-1 text-sm">
            <XCircle className="h-3.5 w-3.5" /> Non
        </span>
    );
}
