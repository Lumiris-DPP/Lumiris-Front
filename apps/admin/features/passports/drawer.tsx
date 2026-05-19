'use client';

import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { AlertTriangle, ExternalLink, Lightbulb, Sparkles } from 'lucide-react';
import { type AdminAuditLogEntry, type IrisAxis, type Passport, type ScoreResult } from '@lumiris/types';
import { mockArtisans, mockInvoices } from '@lumiris/mock-data';
import {
    CompositionList,
    FactureOcrViewer,
    IrisGrade,
    ManufacturingTimeline,
    PassportPhonePreview,
    ScoreBreakdown,
    ScoreCapWarning,
    ScoreReasonsList,
} from '@lumiris/scoring-ui';
import { Badge } from '@lumiris/ui/components/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@lumiris/ui/components/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lumiris/ui/components/tabs';
import { ScrollArea } from '@lumiris/ui/components/scroll-area';
import { cn } from '@lumiris/ui/lib/cn';
import { useAdminAuditLog } from '@/lib/auth';
import { deriveEffectiveStatus, useIrisScore } from './hooks';
import { useCurationStore } from './curation-store';
import { type EffectiveStatus } from './types';
import { CuratorActions } from './curator-actions';

const STATUS_TONE: Record<EffectiveStatus, string> = {
    validated: 'border-lumiris-emerald/40 bg-lumiris-emerald/10 text-lumiris-emerald',
    flagged: 'border-lumiris-rose/40 bg-lumiris-rose/10 text-lumiris-rose',
    changes_requested: 'border-lumiris-amber/40 bg-lumiris-amber/10 text-lumiris-amber',
    archived: 'border-muted-foreground/40 bg-muted text-muted-foreground',
    pending: 'border-lumiris-cyan/40 bg-lumiris-cyan/10 text-lumiris-cyan',
};

interface PassportDrawerProps {
    passport: Passport | null;
    onClose: () => void;
}

export function PassportDrawer({ passport, onClose }: PassportDrawerProps) {
    return (
        <Sheet open={passport !== null} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="bg-background w-full overflow-hidden p-0 sm:max-w-2xl">
                {passport ? <DrawerBody passport={passport} /> : null}
            </SheetContent>
        </Sheet>
    );
}

function DrawerBody({ passport }: { passport: Passport }) {
    const score = useIrisScore(passport);
    const artisan = mockArtisans.find((a) => a.id === passport.artisanId);
    const auditLog = useAdminAuditLog();
    const { overlays } = useCurationStore();
    const overlay = overlays.get(passport.id);
    const [lastAction, setLastAction] = useState<AdminAuditLogEntry | null>(null);

    const status = deriveEffectiveStatus(passport, overlay?.status);

    const passportLog = useMemo(
        () => auditLog.filter((entry) => entry.targetType === 'passport' && entry.targetId === passport.id),
        [auditLog, passport.id],
    );

    return (
        <div className="flex h-full flex-col">
            <SheetHeader className="border-border border-b p-5">
                <div className="flex items-center gap-3">
                    <IrisGrade grade={overlay?.overrideGrade ?? score.grade} size="md" tone="solid" />
                    <div className="min-w-0 flex-1">
                        <SheetTitle className="text-foreground truncate text-base">
                            {passport.garment.reference}
                        </SheetTitle>
                        <p className="text-muted-foreground truncate text-xs">
                            {artisan?.atelierName ?? '-'} · {passport.id}
                        </p>
                    </div>
                    <StatusPill status={status} />
                </div>
            </SheetHeader>

            <Tabs defaultValue="overview" className="flex flex-1 flex-col overflow-hidden">
                <TabsList className="border-border w-full justify-start gap-1 rounded-none border-b bg-transparent px-3">
                    <TabsTrigger value="overview">Aperçu</TabsTrigger>
                    <TabsTrigger value="composition">Composition</TabsTrigger>
                    <TabsTrigger value="steps">Étapes</TabsTrigger>
                    <TabsTrigger value="invoices">Justificatifs</TabsTrigger>
                    <TabsTrigger value="score">Score</TabsTrigger>
                    <TabsTrigger value="history">Historique</TabsTrigger>
                </TabsList>
                <ScrollArea className="flex-1">
                    <div className="p-5">
                        <TabsContent value="overview" className="m-0">
                            <div className="space-y-5">
                                <WhyThisScoreBanner score={score} />
                                <PassportPhonePreview
                                    passport={passport}
                                    artisan={artisan}
                                    score={score}
                                    overrideGrade={overlay?.overrideGrade}
                                />
                                <div className="border-border bg-card grid grid-cols-2 gap-3 rounded-xl border p-4 text-xs">
                                    <Field label="Soumis le" value={fmtDate(passport.createdAt)} />
                                    <Field label="Mis à jour" value={fmtDate(passport.updatedAt)} />
                                    <Field label="Statut DPP" value={passport.status} />
                                    <Field label="GS1 Digital Link" value={passport.gs1.verificationUrl} mono />
                                    <Field label="Garantie" value={`${passport.warranty.durationMonths} mois`} />
                                    <Field
                                        label="Prix public"
                                        value={`${passport.garment.retailPrice.toLocaleString('fr-FR')} €`}
                                    />
                                </div>
                                {overlay?.changesMessage ? (
                                    <div className="border-lumiris-amber/30 bg-lumiris-amber/5 rounded-xl border p-3 text-xs">
                                        <p className="text-lumiris-amber font-medium">Changements demandés</p>
                                        <p className="text-foreground mt-1">{overlay.changesMessage}</p>
                                    </div>
                                ) : null}
                                {overlay?.flagReason ? (
                                    <div className="border-lumiris-rose/30 bg-lumiris-rose/5 rounded-xl border p-3 text-xs">
                                        <p className="text-lumiris-rose font-medium">Anomalie signalée</p>
                                        <p className="text-foreground mt-1">{overlay.flagReason}</p>
                                        {overlay.flagTags && overlay.flagTags.length > 0 ? (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {overlay.flagTags.map((t) => (
                                                    <Badge key={t} variant="outline" className="font-mono text-[10px]">
                                                        {t}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        </TabsContent>

                        <TabsContent value="composition" className="m-0">
                            <CompositionList composition={passport.materials} now={new Date('2026-04-30T08:00:00Z')} />
                        </TabsContent>

                        <TabsContent value="steps" className="m-0">
                            <ManufacturingTimeline steps={passport.steps} />
                        </TabsContent>

                        <TabsContent value="invoices" className="m-0">
                            <InvoicesTab passport={passport} />
                        </TabsContent>

                        <TabsContent value="score" className="m-0">
                            <div className="space-y-5">
                                <div className="border-border bg-card rounded-xl border p-4">
                                    <div className="flex items-baseline justify-between">
                                        <p className="text-muted-foreground text-xs uppercase tracking-wider">
                                            Score Iris
                                        </p>
                                        <span className="text-foreground font-mono text-2xl font-bold">
                                            {score.total.toFixed(1)}
                                        </span>
                                    </div>
                                    <ScoreBreakdown
                                        breakdown={score.breakdown}
                                        weights={score.weights}
                                        className="mt-4"
                                    />
                                </div>
                                {score.cap?.applied ? <ScoreCapWarning cap={score.cap} /> : null}
                                <div>
                                    <p className="text-foreground mb-2 text-sm font-medium">Motifs</p>
                                    <ScoreReasonsList reasons={score.reasons} />
                                </div>
                                <div className="border-border bg-card rounded-xl border p-4">
                                    <p className="text-muted-foreground mb-2 text-[10px] uppercase tracking-wider">
                                        Coefficients appliqués
                                    </p>
                                    <ul className="space-y-1 text-xs">
                                        <li className="flex justify-between">
                                            <span>Transparence</span>
                                            <span className="font-mono">×{score.weights.transparency.toFixed(2)}</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Savoir-faire</span>
                                            <span className="font-mono">×{score.weights.craftsmanship.toFixed(2)}</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Impact</span>
                                            <span className="font-mono">×{score.weights.impact.toFixed(2)}</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Réparabilité</span>
                                            <span className="font-mono">×{score.weights.repairability.toFixed(2)}</span>
                                        </li>
                                    </ul>
                                </div>
                                {overlay?.overrideGrade ? (
                                    <div className="border-lumiris-cyan/30 bg-lumiris-cyan/5 rounded-xl border p-3 text-xs">
                                        <p className="text-lumiris-cyan inline-flex items-center gap-1 font-semibold">
                                            <Sparkles className="h-3 w-3" /> Override actif
                                        </p>
                                        <p className="text-foreground mt-1">
                                            Grade affiché <strong>{overlay.overrideGrade}</strong> au lieu de{' '}
                                            <strong>{score.grade}</strong>.
                                        </p>
                                        <p className="text-muted-foreground mt-1">{overlay.overrideReason}</p>
                                    </div>
                                ) : null}
                            </div>
                        </TabsContent>

                        <TabsContent value="history" className="m-0">
                            <CurationLog entries={passportLog} />
                        </TabsContent>
                    </div>
                </ScrollArea>
            </Tabs>

            {lastAction ? (
                <div
                    role="status"
                    className="border-lumiris-emerald/30 bg-lumiris-emerald/5 text-foreground flex items-center justify-between gap-3 border-t px-4 py-2 text-xs"
                >
                    <span className="text-lumiris-emerald inline-flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3" aria-hidden /> Action <strong>{lastAction.action}</strong>{' '}
                        enregistrée.
                    </span>
                    <Link
                        href={`/gouvernance?focus=${lastAction.id}`}
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-mono text-[11px] underline-offset-2 hover:underline"
                    >
                        Voir cette action dans le journal <ExternalLink className="h-3 w-3" aria-hidden />
                    </Link>
                </div>
            ) : null}

            <CuratorActions passport={passport} score={score} onAfterAction={(entry) => setLastAction(entry)} />
        </div>
    );
}

const AXIS_LABEL: Record<IrisAxis, string> = {
    transparency: 'Transparence',
    craftsmanship: 'Savoir-faire',
    impact: 'Impact',
    repairability: 'Réparabilité',
};

const AXIS_MAX_POINTS: Record<IrisAxis, number> = {
    transparency: 40,
    craftsmanship: 25,
    impact: 25,
    repairability: 10,
};

/** Les 4 axes avec roving tabindex - flèches haut/bas pour naviguer entre les axes. */
function WhyThisScoreBanner({ score }: { score: ScoreResult }) {
    const axes: IrisAxis[] = ['transparency', 'craftsmanship', 'impact', 'repairability'];
    const rows = axes
        .map((axis) => ({
            axis,
            weighted: score.breakdown[axis] * score.weights[axis],
            ratio: score.breakdown[axis] / 100,
            firstReason:
                score.reasons.find((r) => r.axis === axis && (r.severity === 'error' || r.severity === 'warn'))
                    ?.message ??
                score.reasons.find((r) => r.axis === axis)?.message ??
                'Aucun motif détecté',
        }))
        .sort((a, b) => a.ratio - b.ratio);

    const [focusIndex, setFocusIndex] = useState(0);
    const itemsRef = useRef<Array<HTMLLIElement | null>>([]);

    const handleKey = (event: KeyboardEvent<HTMLLIElement>, index: number) => {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown' && event.key !== 'Home' && event.key !== 'End') return;
        event.preventDefault();
        const max = rows.length - 1;
        const next =
            event.key === 'ArrowDown'
                ? Math.min(max, index + 1)
                : event.key === 'ArrowUp'
                  ? Math.max(0, index - 1)
                  : event.key === 'End'
                    ? max
                    : 0;
        setFocusIndex(next);
        itemsRef.current[next]?.focus();
    };

    return (
        <div className="border-lumiris-amber/30 bg-lumiris-amber/5 rounded-xl border p-4">
            <p
                id="why-this-score-heading"
                className="text-lumiris-amber inline-flex items-center gap-1.5 text-xs font-semibold"
            >
                <Lightbulb className="h-3.5 w-3.5" aria-hidden /> Pourquoi ce score ?
            </p>
            <ul
                role="listbox"
                aria-labelledby="why-this-score-heading"
                aria-orientation="vertical"
                className="mt-2 space-y-2 text-xs"
            >
                {rows.map((row, index) => {
                    const points = Math.round(row.weighted);
                    const max = AXIS_MAX_POINTS[row.axis];
                    const isFocused = focusIndex === index;
                    return (
                        <li
                            key={row.axis}
                            ref={(node) => {
                                itemsRef.current[index] = node;
                            }}
                            role="option"
                            aria-selected={isFocused}
                            tabIndex={isFocused ? 0 : -1}
                            onKeyDown={(event) => handleKey(event, index)}
                            onFocus={() => setFocusIndex(index)}
                            className="text-foreground focus-visible:ring-ring focus-visible:ring-offset-card -mx-1 rounded-md px-1 outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        >
                            <strong>
                                {AXIS_LABEL[row.axis]} {points}/{max}
                            </strong>{' '}
                            — <span className="text-muted-foreground">{row.firstReason}</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

function StatusPill({ status }: { status: EffectiveStatus }) {
    return (
        <Badge variant="outline" className={cn('font-mono text-[10px]', STATUS_TONE[status])}>
            {status}
        </Badge>
    );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</p>
            <p className={cn('text-foreground mt-0.5 truncate', mono ? 'font-mono text-[11px]' : 'text-xs')}>{value}</p>
        </div>
    );
}

function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function InvoicesTab({ passport }: { passport: Passport }) {
    const linkedInvoices = useMemo(() => {
        const refs = new Set(passport.materials.map((m) => m.invoiceRef).filter(Boolean));
        return mockInvoices.filter((inv) => refs.has(inv.id));
    }, [passport]);

    const artisan = mockArtisans.find((a) => a.id === passport.artisanId);
    const passportCerts = passport.certifications;

    // Cross-check par artisan : on récupère les certifs de tous les passeports du même artisan
    // et on signale les incohérences (ex. fournisseur déclaré différemment selon les passeports).
    const inconsistencies = useMemo(() => {
        return passport.materials.filter((m) => !m.invoiceRef && m.percentage > 0);
    }, [passport]);

    return (
        <div className="space-y-5">
            <section>
                <h3 className="text-foreground mb-2 text-sm font-semibold">Factures OCR</h3>
                {linkedInvoices.length === 0 ? (
                    <p className="text-muted-foreground text-xs">Aucune facture liée.</p>
                ) : (
                    <div className="space-y-2">
                        {linkedInvoices.map((inv) => (
                            <FactureOcrViewer key={inv.id} invoice={inv} />
                        ))}
                    </div>
                )}
            </section>

            <section>
                <h3 className="text-foreground mb-2 text-sm font-semibold">Certificats joints</h3>
                {passportCerts.length === 0 ? (
                    <p className="text-muted-foreground text-xs">Aucun certificat de passeport.</p>
                ) : (
                    <ul className="border-border bg-card divide-border divide-y rounded-xl border text-xs">
                        {passportCerts.map((c) => (
                            <li key={c.id} className="flex items-baseline justify-between px-3 py-2">
                                <div>
                                    <p className="text-foreground font-medium">
                                        {c.kind} {c.customName ? `· ${c.customName}` : ''}
                                    </p>
                                    <p className="text-muted-foreground text-[10px]">
                                        {c.issuer} · expire {fmtDate(c.expiresAt)}
                                    </p>
                                </div>
                                <Badge variant="outline" className="font-mono text-[10px]">
                                    {c.verified ? 'vérifié' : 'non vérifié'}
                                </Badge>
                            </li>
                        ))}
                    </ul>
                )}
                {inconsistencies.length > 0 ? (
                    <div className="border-lumiris-amber/30 bg-lumiris-amber/5 mt-3 rounded-xl border p-3 text-xs">
                        <p className="text-lumiris-amber inline-flex items-center gap-1 font-semibold">
                            <AlertTriangle className="h-3 w-3" /> Incohérence cross-check artisan
                        </p>
                        <p className="text-foreground mt-1">
                            {inconsistencies.length} ligne(s) de composition sans invoiceRef pour{' '}
                            {artisan?.atelierName ?? 'cet artisan'}.
                        </p>
                    </div>
                ) : null}
            </section>

            <section>
                <h3 className="text-foreground mb-2 text-sm font-semibold">Déclarations sur l&apos;honneur</h3>
                <ul className="border-border bg-card divide-border divide-y rounded-xl border text-xs">
                    <li className="flex items-baseline justify-between px-3 py-2">
                        <p className="text-foreground">Déclaration ESPR - composition fidèle</p>
                        <p className="text-muted-foreground font-mono text-[10px]">
                            signée le {fmtDate(passport.createdAt)}
                        </p>
                    </li>
                    <li className="flex items-baseline justify-between px-3 py-2">
                        <p className="text-foreground">Déclaration AGEC - origine et étapes vérifiées</p>
                        <p className="text-muted-foreground font-mono text-[10px]">
                            signée le {fmtDate(passport.createdAt)}
                        </p>
                    </li>
                </ul>
            </section>
        </div>
    );
}

function CurationLog({ entries }: { entries: ReturnType<typeof useAdminAuditLog> }) {
    if (entries.length === 0) {
        return <p className="text-muted-foreground text-xs">Pas encore d&apos;historique.</p>;
    }
    return (
        <ol className="relative space-y-3 border-l border-dashed pl-5">
            {entries.map((entry) => (
                <li key={entry.id} className="relative">
                    <span className="bg-foreground absolute -left-[27px] top-2 block h-2 w-2 rounded-full" />
                    <div className="border-border bg-card rounded-lg border p-3 text-xs">
                        <div className="flex items-baseline justify-between gap-3">
                            <p className="text-foreground font-mono text-[11px]">{entry.action}</p>
                            <span className="text-muted-foreground font-mono text-[10px]">
                                {new Date(entry.ts).toLocaleString('fr-FR', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        </div>
                        <p className="text-muted-foreground mt-1 truncate text-[11px]">
                            par <strong className="text-foreground">{entry.actorId}</strong> · {entry.actorRole}
                        </p>
                        {Object.keys(entry.payload).length > 0 ? (
                            <pre className="text-muted-foreground/80 mt-2 overflow-x-auto whitespace-pre-wrap text-[10px]">
                                {JSON.stringify(entry.payload, null, 2)}
                            </pre>
                        ) : null}
                    </div>
                </li>
            ))}
        </ol>
    );
}
