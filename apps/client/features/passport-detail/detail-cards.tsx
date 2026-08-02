import Image from 'next/image';
import { CheckCircle, Clock, ExternalLink, XCircle } from 'lucide-react';
import { formatDateFr } from '@lumiris/utils';
import type { Passport, ScoreResult } from '@lumiris/types';
import {
    careSymbol,
    IrisGrade,
    IrisMethodologyInfo,
    MissingFieldsBadge,
    ScoreBreakdown,
    ScoreCapWarning,
} from '@lumiris/scoring-ui';
import { Badge } from '@lumiris/ui/components/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import type { DetailView } from './view-model';

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[11px] tracking-wider text-muted-foreground uppercase">{label}</span>
            <span className="text-sm text-foreground">{value}</span>
        </div>
    );
}

function BooleanField({ value }: { value: boolean | null | undefined }) {
    if (value === null || value === undefined) return <span className="text-sm text-muted-foreground">—</span>;
    return value ? (
        <span className="flex items-center gap-1 text-sm text-lumiris-emerald">
            <CheckCircle className="h-3.5 w-3.5" /> Oui
        </span>
    ) : (
        <span className="flex items-center gap-1 text-sm text-lumiris-rose">
            <XCircle className="h-3.5 w-3.5" /> Non
        </span>
    );
}

function BadgeList({ items, variant }: { items: string[]; variant: 'secondary' | 'outline' }) {
    if (items.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-1 pt-0.5">
            {items.map((item) => (
                <Badge key={item} variant={variant} className="text-xs">
                    {item}
                </Badge>
            ))}
        </div>
    );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[11px] tracking-wider text-muted-foreground uppercase">{label}</span>
            {children}
        </div>
    );
}

/** Statut du DPP ; rien à afficher pour un passeport local (démo/brouillon non envoyé). */
function DppStatusBadge({ status }: { status: DetailView['apiStatus'] }) {
    if (status === 'DRAFT') {
        return (
            <Badge variant="outline" className="border-lumiris-amber/40 bg-lumiris-amber/5 text-lumiris-amber">
                Brouillon
            </Badge>
        );
    }
    if (status === 'VALID') return <Badge variant="default">Publié</Badge>;
    if (status === 'INVALID') return <Badge variant="destructive">Invalide</Badge>;
    return null;
}

export function IdentityCard({ view }: { view: DetailView }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <CardTitle>{view.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">créé le {formatDateFr(view.createdAt)}</p>
                    </div>
                    <DppStatusBadge status={view.apiStatus} />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <Image
                    src={view.photo}
                    alt={`Visuel principal du passeport ${view.reference}`}
                    width={640}
                    height={288}
                    unoptimized
                    className="max-h-72 w-auto rounded-xl border border-border object-contain"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                    <InfoRow label="Description" value={view.description} />
                    <InfoRow label="Catégorie" value={view.category} />
                    <InfoRow label="Pays d'origine" value={view.originCountry} />
                    <InfoRow label="Tailles disponibles" value={<BadgeList items={view.sizes} variant="secondary" />} />
                    <InfoRow label="Couleurs" value={<BadgeList items={view.colors} variant="outline" />} />
                </div>
            </CardContent>
        </Card>
    );
}

export function CompositionCard({ view }: { view: DetailView }) {
    const isEmpty =
        view.materials.length === 0 && view.careInstructions.length === 0 && view.certifications.length === 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Composition &amp; Entretien</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
                {view.materials.length > 0 && (
                    <div className="space-y-1">
                        <p className="text-[11px] tracking-wider text-muted-foreground uppercase">Matières</p>
                        {view.materials.map((m, i) => (
                            <p key={i} className="text-sm text-foreground">
                                <span className="font-mono">{m.percentage}%</span> {m.fiber}
                                {m.originCountry && <span className="text-muted-foreground"> · {m.originCountry}</span>}
                            </p>
                        ))}
                    </div>
                )}

                {view.careInstructions.length > 0 && (
                    <div className="space-y-1">
                        <p className="text-[11px] tracking-wider text-muted-foreground uppercase">
                            Instructions d&apos;entretien
                        </p>
                        <ul className="grid grid-cols-1 gap-1.5 pt-0.5 sm:grid-cols-2">
                            {view.careInstructions.map((instr, i) => {
                                const symbol = careSymbol(instr);
                                return (
                                    <li
                                        key={i}
                                        className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-2"
                                    >
                                        {symbol ? (
                                            <Image
                                                src={symbol.svgPath}
                                                alt=""
                                                aria-hidden
                                                width={20}
                                                height={20}
                                                className="h-5 w-5 shrink-0"
                                            />
                                        ) : (
                                            <span className="h-5 w-5 shrink-0" aria-hidden />
                                        )}
                                        <span className="truncate text-sm text-foreground">
                                            {symbol?.label ?? instr}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                {view.certifications.length > 0 && (
                    <div className="space-y-1">
                        <p className="text-[11px] tracking-wider text-muted-foreground uppercase">Certifications</p>
                        <div className="flex flex-wrap gap-2">
                            {view.certifications.map((cert, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                    {cert.customName ?? cert.name}
                                    {cert.licenseNumber && (
                                        <span className="ml-1 text-muted-foreground">#{cert.licenseNumber}</span>
                                    )}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {isEmpty && <p className="text-sm text-muted-foreground">Aucune donnée renseignée.</p>}
            </CardContent>
        </Card>
    );
}

export function TraceabilityCard({ view }: { view: DetailView }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Traçabilité</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                    <InfoRow label="Date de fabrication" value={view.manufacturedAt} />
                    <InfoRow label="Numéro de lot" value={view.batchNumber} />
                    <InfoRow label="GTIN" value={view.gtin} />
                    <InfoRow label="SKU" value={view.sku} />
                    <FieldGroup label="Conformité REACH">
                        <BooleanField value={view.reachCompliant} />
                    </FieldGroup>
                </div>
            </CardContent>
        </Card>
    );
}

export function SustainabilityCard({ view }: { view: DetailView }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Durabilité &amp; Fin de vie</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                    <InfoRow
                        label="Matières recyclées"
                        value={view.recycledPct != null ? `${view.recycledPct} %` : null}
                    />
                    <InfoRow label="Garantie" value={view.warranty} />
                    <FieldGroup label="Réparable">
                        <BooleanField value={view.isRepairable} />
                    </FieldGroup>
                    <InfoRow label="Instructions fin de vie" value={view.endOfLifeInstructions} />
                </div>
            </CardContent>
        </Card>
    );
}

// Explorateur Sepolia (testnet) : le backend ancre l'empreinte du DPP sur ce réseau.
const SEPOLIA_TX_BASE = 'https://sepolia.etherscan.io/tx/';

// Rend visible une revendication de confiance centrale : l'ancrage on-chain de l'empreinte du DPP.
export function BlockchainAnchorCard({ view }: { view: DetailView }) {
    const status = view.blockchainAnchorStatus?.toUpperCase();
    if (!status) return null;

    const meta =
        status === 'ANCHORED'
            ? {
                  label: 'Certifié',
                  icon: <CheckCircle className="h-4 w-4 text-lumiris-emerald" aria-hidden />,
                  className: 'text-lumiris-emerald',
                  description:
                      'Ce passeport est sécurisé et horodaté. Son authenticité est garantie de manière infalsifiable.',
              }
            : status === 'FAILED'
              ? {
                    label: 'Échec de la certification',
                    icon: <XCircle className="h-4 w-4 text-lumiris-rose" aria-hidden />,
                    className: 'text-lumiris-rose',
                    description:
                        'La certification numérique a échoué. Le passeport reste valide, mais sa preuve d’authenticité n’est pas disponible.',
                }
              : {
                    label: 'En attente',
                    icon: <Clock className="h-4 w-4 text-lumiris-amber" aria-hidden />,
                    className: 'text-lumiris-amber',
                    description: 'La certification de ce passeport est en attente.',
                };

    const hash = view.blockchainTxHash;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Preuve d’existence numérique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                    {meta.icon}
                    <span className={`text-sm font-medium ${meta.className}`}>{meta.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{meta.description}</p>
                {status === 'ANCHORED' && hash && (
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] tracking-wider text-muted-foreground uppercase">Transaction</span>
                        <a
                            href={`${SEPOLIA_TX_BASE}${hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-xs break-all text-lumiris-cyan hover:underline"
                        >
                            {hash}
                            <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                        </a>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function ScoreAside({ score, passport }: { score: ScoreResult; passport: Passport }) {
    return (
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-1.5">
                        <p className="text-[11px] tracking-wider text-muted-foreground uppercase">Score Iris</p>
                        <IrisMethodologyInfo />
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                        <IrisGrade grade={score.grade} size="lg" />
                        <p className="font-mono text-2xl font-semibold text-foreground">
                            {score.total.toFixed(1)}
                            <span className="ml-0.5 text-sm font-normal text-muted-foreground/70">/ 100</span>
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ScoreBreakdown breakdown={score.breakdown} weights={score.weights} />
                    {score.cap?.applied && <ScoreCapWarning cap={score.cap} />}
                    <div className="flex items-center justify-between border-t pt-3">
                        <span className="text-xs text-muted-foreground">Champs ESPR/AGEC</span>
                        <MissingFieldsBadge passport={passport} showWhenComplete />
                    </div>
                </CardContent>
            </Card>
        </aside>
    );
}
