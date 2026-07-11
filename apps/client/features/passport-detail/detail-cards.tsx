import Image from 'next/image';
import { CheckCircle, XCircle } from 'lucide-react';
import { formatDateFr } from '@lumiris/utils';
import type { Passport, ScoreResult } from '@lumiris/types';
import { IrisGrade, MissingFieldsBadge, ScoreBreakdown, ScoreCapWarning } from '@lumiris/scoring-ui';
import { Badge } from '@lumiris/ui/components/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import type { DetailView } from './view-model';

export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-[11px] uppercase tracking-wider">{label}</span>
            <span className="text-foreground text-sm">{value}</span>
        </div>
    );
}

export function BooleanField({ value }: { value: boolean | null | undefined }) {
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
            <span className="text-muted-foreground text-[11px] uppercase tracking-wider">{label}</span>
            {children}
        </div>
    );
}

export function IdentityCard({ view }: { view: DetailView }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{view.title}</CardTitle>
                <p className="text-muted-foreground text-sm">créé le {formatDateFr(view.createdAt)}</p>
            </CardHeader>
            <CardContent className="space-y-4">
                <Image
                    src={view.photo}
                    alt={`Visuel principal du passeport ${view.reference}`}
                    width={640}
                    height={288}
                    unoptimized
                    className="border-border max-h-72 w-auto rounded-xl border object-contain"
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
                        <p className="text-muted-foreground text-[11px] uppercase tracking-wider">Matières</p>
                        {view.materials.map((m, i) => (
                            <p key={i} className="text-foreground text-sm">
                                <span className="font-mono">{m.percentage}%</span> {m.fiber}
                                {m.originCountry && <span className="text-muted-foreground"> · {m.originCountry}</span>}
                            </p>
                        ))}
                    </div>
                )}

                {view.careInstructions.length > 0 && (
                    <div className="space-y-1">
                        <p className="text-muted-foreground text-[11px] uppercase tracking-wider">
                            Instructions d&apos;entretien
                        </p>
                        <ul className="space-y-0.5">
                            {view.careInstructions.map((instr, i) => (
                                <li key={i} className="text-foreground text-sm">
                                    · {instr}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {view.certifications.length > 0 && (
                    <div className="space-y-1">
                        <p className="text-muted-foreground text-[11px] uppercase tracking-wider">Certifications</p>
                        <div className="flex flex-wrap gap-2">
                            {view.certifications.map((cert, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                    {cert.customName ?? cert.name}
                                    {cert.licenseNumber && (
                                        <span className="text-muted-foreground ml-1">#{cert.licenseNumber}</span>
                                    )}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {isEmpty && <p className="text-muted-foreground text-sm">Aucune donnée renseignée.</p>}
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

export function ScoreAside({ score, passport }: { score: ScoreResult; passport: Passport }) {
    return (
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
    );
}
