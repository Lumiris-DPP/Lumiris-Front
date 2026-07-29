'use client';

import { useCallback, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight, Info, ShieldCheck, TriangleAlert } from 'lucide-react';
import type { AffiliationEvent } from '@lumiris/types';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@lumiris/ui/components/alert-dialog';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { DataTableFilters } from '@lumiris/ui/components/data-table-filters';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { cn } from '@lumiris/ui/lib/cn';
import { useLogAction, usePermission } from '@/lib/auth';
import { ANONYMISATION_THRESHOLD_DAYS, NOW_REF, type SuspiciousFlag } from '@/lib/affiliation-fraud';
import { EmptyState } from '../_shared/empty-state';
import { FraudCaseDrawer } from './fraud-case-drawer';
import {
    FRAUD_PATTERN_LABEL,
    type AntiConflictAlert,
    type FraudCase,
    type FraudCaseStatus,
    type FraudPattern,
} from './types';

type DetectionStatusFilter = 'all' | 'open' | 'resolved';

interface DetectionsTabProps {
    events: readonly AffiliationEvent[];
    suspicions: ReadonlyMap<string, SuspiciousFlag>;
    resolvedCases: ReadonlySet<string>;
    anonymisedCases: ReadonlySet<string>;
    resolvedAnomalies: ReadonlySet<string>;
    thresholdDays: number;
    onFlagFraud: (id: string) => void;
    onResolveCase: (id: string) => void;
    onAnonymiseCase: (id: string) => void;
    onResolveAnomaly: (id: string) => void;
    onSaveThreshold: (days: number) => void;
}

interface PartnerStat {
    name: string;
    selfBooking: AffiliationEvent[];
    burst: AffiliationEvent[];
    totalEur: number;
    userIds: Set<string>;
}

type DetectionItem =
    | {
          kind: 'fraud';
          id: string;
          occurredAt: string;
          status: FraudCaseStatus;
          case: FraudCase;
      }
    | {
          kind: 'anomaly';
          id: string;
          occurredAt: string;
          status: 'open' | 'resolved';
          alert: AntiConflictAlert;
      };

function derivePattern(event: AffiliationEvent, flag: SuspiciousFlag): FraudPattern {
    if (event.flaggedAsFraud) return 'manual';
    if (flag.burst) return 'burst';
    if (flag.selfBooking) return 'self_booking';
    if (flag.geo) return 'geo';
    return 'manual';
}

export function DetectionsTab({
    events,
    suspicions,
    resolvedCases,
    anonymisedCases,
    resolvedAnomalies,
    thresholdDays,
    onFlagFraud,
    onResolveCase,
    onAnonymiseCase,
    onResolveAnomaly,
    onSaveThreshold,
}: DetectionsTabProps) {
    const log = useLogAction();
    const canAuditLog = usePermission('governance.read_audit_log');

    const [statusFilter, setStatusFilter] = useState<DetectionStatusFilter>('all');
    const [search, setSearch] = useState('');
    const [openCaseId, setOpenCaseId] = useState<string | null>(null);
    const [anonymiseTarget, setAnonymiseTarget] = useState<FraudCase | null>(null);
    const [thresholdDraft, setThresholdDraft] = useState(String(thresholdDays));

    const fraudCases = useMemo<readonly FraudCase[]>(() => {
        const out: FraudCase[] = [];
        for (const event of events) {
            const flag = suspicions.get(event.id);
            const hasSuspicion = flag && (flag.burst || flag.selfBooking || flag.geo);
            if (!hasSuspicion && !event.flaggedAsFraud) continue;
            out.push({ event, flag: flag ?? {}, pattern: derivePattern(event, flag ?? {}) });
        }
        return out;
    }, [events, suspicions]);

    const anomalyAlerts = useMemo(() => buildAlerts(events, suspicions), [events, suspicions]);

    const fraudStatusOf = useCallback<(id: string) => FraudCaseStatus>(
        (id) => (anonymisedCases.has(id) ? 'anonymised' : resolvedCases.has(id) ? 'resolved' : 'open'),
        [anonymisedCases, resolvedCases],
    );

    const stats = useMemo(() => {
        const open =
            fraudCases.filter((c) => fraudStatusOf(c.event.id) === 'open').length +
            anomalyAlerts.filter((a) => !resolvedAnomalies.has(a.id)).length;
        const resolved30 = fraudCases.filter((c) => {
            if (fraudStatusOf(c.event.id) !== 'resolved') return false;
            return NOW_REF - new Date(c.event.occurredAt).getTime() < 30 * 86_400_000;
        }).length;
        const fraudRate = events.length === 0 ? 0 : (fraudCases.length / events.length) * 100;
        return { open, resolved30, fraudRate };
    }, [fraudCases, anomalyAlerts, events.length, resolvedAnomalies, fraudStatusOf]);

    const items = useMemo<readonly DetectionItem[]>(() => {
        const fraudItems: DetectionItem[] = fraudCases.map((c) => ({
            kind: 'fraud',
            id: c.event.id,
            occurredAt: c.event.occurredAt,
            status: fraudStatusOf(c.event.id),
            case: c,
        }));
        const anomalyItems: DetectionItem[] = anomalyAlerts.map((a) => ({
            kind: 'anomaly',
            id: a.id,
            occurredAt: a.occurredAt,
            status: resolvedAnomalies.has(a.id) ? 'resolved' : 'open',
            alert: a,
        }));
        return [...fraudItems, ...anomalyItems].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    }, [fraudCases, anomalyAlerts, resolvedAnomalies, fraudStatusOf]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((item) => {
            if (statusFilter === 'open' && item.status !== 'open') return false;
            if (statusFilter === 'resolved' && item.status === 'open') return false;
            if (!q) return true;
            if (item.kind === 'fraud') {
                return (
                    item.case.event.id.toLowerCase().includes(q) ||
                    item.case.event.beneficiaryDisplayName.toLowerCase().includes(q) ||
                    item.case.event.beneficiaryId.toLowerCase().includes(q)
                );
            }
            return (
                item.alert.title.toLowerCase().includes(q) ||
                item.alert.partnerName.toLowerCase().includes(q) ||
                item.alert.partnerId.toLowerCase().includes(q)
            );
        });
    }, [items, statusFilter, search]);

    const openCase = openCaseId ? (fraudCases.find((c) => c.event.id === openCaseId) ?? null) : null;

    const handleAnonymise = () => {
        if (!anonymiseTarget) return;
        log({
            action: 'governance.read_audit_log',
            targetType: 'affiliation_event',
            targetId: anonymiseTarget.event.id,
            payload: {
                decision: 'anonymised',
                pattern: anonymiseTarget.pattern,
                beneficiary: anonymiseTarget.event.beneficiaryId,
            },
        });
        onAnonymiseCase(anonymiseTarget.event.id);
        setAnonymiseTarget(null);
    };

    const parsedThreshold = Number(thresholdDraft);
    const thresholdDirty = Number.isFinite(parsedThreshold) && parsedThreshold !== thresholdDays && parsedThreshold > 0;

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-3 gap-6">
                <Kpi label="Cas ouverts" value={`${stats.open}`} tone="text-lumiris-rose" />
                <Kpi label="Résolus 30 j" value={`${stats.resolved30}`} tone="text-lumiris-emerald" />
                <Kpi label="Taux fraude estimé" value={`${stats.fraudRate.toFixed(1)} %`} tone="text-lumiris-amber" />
            </div>

            <DataTableFilters
                search={{
                    value: search,
                    onChange: setSearch,
                    placeholder: 'ID, bénéficiaire, partenaire…',
                }}
                filters={[
                    {
                        label: 'Statut',
                        value: statusFilter,
                        onChange: (v) => setStatusFilter(v as DetectionStatusFilter),
                        options: [
                            { value: 'all', label: 'Tous statuts' },
                            { value: 'open', label: 'Ouvert' },
                            { value: 'resolved', label: 'Résolu/Anonymisé' },
                        ],
                    },
                ]}
                onReset={() => {
                    setSearch('');
                    setStatusFilter('all');
                }}
            />

            {filtered.length === 0 ? (
                <EmptyState
                    icon={ShieldCheck}
                    title="Aucune détection sur la fenêtre"
                    description="Aucune fraude ni anomalie active ne correspond aux filtres."
                />
            ) : (
                <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                    {filtered.map((item) =>
                        item.kind === 'fraud' ? (
                            <FraudCaseCard key={item.id} item={item} onOpen={() => setOpenCaseId(item.case.event.id)} />
                        ) : (
                            <AnomalyCard key={item.id} item={item} onResolve={() => onResolveAnomaly(item.alert.id)} />
                        ),
                    )}
                </ul>
            )}

            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 text-xs">
                <Label htmlFor="anon-threshold" className="inline-flex items-center gap-2 text-foreground">
                    <AlertTriangle className="h-3.5 w-3.5 text-lumiris-amber" aria-hidden /> Seuil anonymisation auto
                </Label>
                <Input
                    id="anon-threshold"
                    type="number"
                    min={1}
                    value={thresholdDraft}
                    onChange={(e) => setThresholdDraft(e.target.value)}
                    className="h-8 w-20 font-mono text-xs"
                />
                <span className="text-[11px] text-muted-foreground">
                    jours (défaut : {ANONYMISATION_THRESHOLD_DAYS} j).
                </span>
                <Button
                    size="sm"
                    variant="outline"
                    disabled={!thresholdDirty}
                    onClick={() => onSaveThreshold(parsedThreshold)}
                    className="ml-auto"
                >
                    Enregistrer
                </Button>
            </div>

            <FraudCaseDrawer
                fraudCase={openCase}
                anonymised={openCase ? anonymisedCases.has(openCase.event.id) : false}
                canAuditLog={canAuditLog}
                resolved={openCase ? resolvedCases.has(openCase.event.id) : false}
                onClose={() => setOpenCaseId(null)}
                onFlag={() => openCase && onFlagFraud(openCase.event.id)}
                onResolve={() => openCase && onResolveCase(openCase.event.id)}
                onAnonymise={() => openCase && setAnonymiseTarget(openCase)}
            />

            <AlertDialog open={anonymiseTarget !== null} onOpenChange={(o) => !o && setAnonymiseTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Anonymiser ce cas ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            L&apos;identifiant utilisateur sera remplacé par un hash <code>user_anon_xxx</code>{' '}
                            irréversible pour <strong>{anonymiseTarget?.event.beneficiaryDisplayName}</strong>.
                            L&apos;action est tracée dans l&apos;audit log.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleAnonymise}>Anonymiser</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

const PATTERN_TONE: Record<FraudPattern, string> = {
    burst: 'border-lumiris-amber/40 text-lumiris-amber',
    self_booking: 'border-lumiris-rose/40 text-lumiris-rose',
    geo: 'border-lumiris-amber/40 text-lumiris-amber',
    manual: 'border-lumiris-rose/40 text-lumiris-rose',
};

const FRAUD_STATUS_LABEL: Record<FraudCaseStatus, string> = {
    open: 'Ouvert',
    resolved: 'Résolu',
    anonymised: 'Anonymisé',
};

const FRAUD_STATUS_TONE: Record<FraudCaseStatus, string> = {
    open: 'border-lumiris-rose/40 text-lumiris-rose',
    resolved: 'border-lumiris-emerald/40 text-lumiris-emerald',
    anonymised: 'border-lumiris-cyan/40 text-lumiris-cyan',
};

function FraudCaseCard({ item, onOpen }: { item: Extract<DetectionItem, { kind: 'fraud' }>; onOpen: () => void }) {
    const { case: fraudCase, status } = item;
    return (
        <li>
            <button
                type="button"
                onClick={onOpen}
                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted/40"
            >
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-lumiris-rose" aria-hidden />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                        <Badge
                            variant="outline"
                            className="border-lumiris-rose/40 font-mono text-[10px] text-lumiris-rose"
                        >
                            Fraude
                        </Badge>
                        <Badge
                            variant="outline"
                            className={cn('font-mono text-[10px]', PATTERN_TONE[fraudCase.pattern])}
                        >
                            {FRAUD_PATTERN_LABEL[fraudCase.pattern]}
                        </Badge>
                        <p className="text-sm text-foreground">{fraudCase.event.beneficiaryDisplayName}</p>
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {fraudCase.event.id} · {fraudCase.event.commission.amountEur.toFixed(2)} € ·{' '}
                        {new Date(fraudCase.event.occurredAt).toLocaleString('fr-FR')}
                    </p>
                </div>
                <Badge variant="outline" className={cn('font-mono text-[10px]', FRAUD_STATUS_TONE[status])}>
                    {FRAUD_STATUS_LABEL[status]}
                </Badge>
                <ChevronRight className="mt-1 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            </button>
        </li>
    );
}

function AnomalyCard({
    item,
    onResolve,
}: {
    item: Extract<DetectionItem, { kind: 'anomaly' }>;
    onResolve: () => void;
}) {
    const { alert, status } = item;
    const isWarn = alert.severity === 'warn';
    const Icon = isWarn ? TriangleAlert : Info;
    return (
        <li className="flex items-start gap-3 px-4 py-3">
            <Icon
                className={cn('mt-0.5 h-4 w-4 shrink-0', isWarn ? 'text-lumiris-amber' : 'text-lumiris-cyan')}
                aria-hidden
            />
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                    <Badge
                        variant="outline"
                        className="border-lumiris-amber/40 font-mono text-[10px] text-lumiris-amber"
                    >
                        Anomalie
                    </Badge>
                    <Badge
                        variant="outline"
                        className={cn(
                            'font-mono text-[10px]',
                            isWarn
                                ? 'border-lumiris-amber/40 text-lumiris-amber'
                                : 'border-lumiris-cyan/40 text-lumiris-cyan',
                        )}
                    >
                        {alert.partnerName}
                    </Badge>
                    <p className="text-sm text-foreground">{alert.title}</p>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{alert.detail}</p>
                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    {new Date(alert.occurredAt).toLocaleString('fr-FR')} · {alert.eventIds.length} évén.
                </p>
            </div>
            {status === 'open' ? (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={onResolve}>
                    <CheckCircle2 className="h-3 w-3" /> Marquer résolu
                </Button>
            ) : (
                <Badge
                    variant="outline"
                    className="border-lumiris-emerald/40 font-mono text-[10px] text-lumiris-emerald"
                >
                    Résolu
                </Badge>
            )}
        </li>
    );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone: string }) {
    return (
        <div>
            <p className="text-[10px] tracking-wider text-muted-foreground uppercase">{label}</p>
            <p className={cn('mt-1 font-mono text-2xl font-semibold', tone)}>{value}</p>
        </div>
    );
}

function buildAlerts(
    events: readonly AffiliationEvent[],
    suspicions: ReadonlyMap<string, SuspiciousFlag>,
): readonly AntiConflictAlert[] {
    const byPartner = new Map<string, PartnerStat>();
    for (const event of events) {
        const stat =
            byPartner.get(event.beneficiaryId) ??
            ({
                name: event.beneficiaryDisplayName,
                selfBooking: [],
                burst: [],
                totalEur: 0,
                userIds: new Set<string>(),
            } satisfies PartnerStat);
        const flag = suspicions.get(event.id);
        if (flag?.selfBooking) stat.selfBooking.push(event);
        if (flag?.burst) stat.burst.push(event);
        stat.totalEur += event.commission.amountEur;
        stat.userIds.add(event.userId);
        byPartner.set(event.beneficiaryId, stat);
    }

    const latestAt = (list: readonly AffiliationEvent[]): string =>
        list.reduce((max, e) => (e.occurredAt > max ? e.occurredAt : max), '');

    const alerts: AntiConflictAlert[] = [];

    for (const [partnerId, stat] of byPartner.entries()) {
        if (stat.selfBooking.length > 0) {
            alerts.push({
                id: `anti-conflict-self-${partnerId}`,
                severity: 'warn',
                title: `${stat.selfBooking.length} auto-réservation(s) détectée(s)`,
                detail: `Le bénéficiaire encaisse une commission sur ses propres scans — conflit d'intérêt direct.`,
                partnerId,
                partnerName: stat.name,
                occurredAt: latestAt(stat.selfBooking),
                eventIds: stat.selfBooking.map((e) => e.id),
            });
        }
        if (stat.burst.length >= 2 && stat.userIds.size <= 2) {
            alerts.push({
                id: `anti-conflict-burst-${partnerId}`,
                severity: 'warn',
                title: `Concentration ${stat.burst.length} pics — ${stat.userIds.size} utilisateur(s)`,
                detail: `Toutes les conversions “burst” proviennent d'un cercle réduit d'utilisateurs : faisceau de complaisance probable.`,
                partnerId,
                partnerName: stat.name,
                occurredAt: latestAt(stat.burst),
                eventIds: stat.burst.map((e) => e.id),
            });
        }
        if (stat.userIds.size === 1 && stat.totalEur > 20) {
            const partnerEvents = events.filter((e) => e.beneficiaryId === partnerId);
            alerts.push({
                id: `anti-conflict-mono-${partnerId}`,
                severity: 'info',
                title: `100 % des commissions issues d'un seul utilisateur`,
                detail: `${stat.totalEur.toFixed(2)} € versés au bénéficiaire provenant d'une unique identité — vérifier l'indépendance.`,
                partnerId,
                partnerName: stat.name,
                occurredAt: latestAt(partnerEvents),
                eventIds: partnerEvents.map((e) => e.id),
            });
        }
    }

    return alerts.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}
