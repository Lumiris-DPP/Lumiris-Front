'use client';

import { memo, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Download, Filter, History, Search, ShieldAlert } from 'lucide-react';
import type { AdminAction, AdminAuditLogEntry, AdminUserRole } from '@lumiris/types';
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
import { Input } from '@lumiris/ui/components/input';
import { ScrollArea } from '@lumiris/ui/components/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@lumiris/ui/components/sheet';
import { Textarea } from '@lumiris/ui/components/textarea';
import { cn } from '@lumiris/ui/lib/cn';
import {
    useAdminAuditLog,
    useAnomalyReviews,
    useCurrentUser,
    useLogAction,
    usePermission,
    type AnomalyReview,
    type AnomalyReviewStatus,
} from '@/lib/auth';
import { ANOMALY_RULE_LABEL, detectAnomalies, type AnomalyAlert } from '@/lib/governance-anomalies';
import { GovernanceBanner } from '../_shared/governance-banner';
import { NonNegotiableBanner } from '../_shared/non-negotiable-banner';
import { PaginationBar } from '../_shared/pagination-bar';
import { usePagination } from '../_shared/use-pagination';

const ACTION_TONE: Record<AdminAction, string> = {
    'passport.read': 'text-muted-foreground',
    'passport.curate': 'text-lumiris-cyan',
    'passport.validate': 'text-lumiris-emerald',
    'passport.flag': 'text-lumiris-rose',
    'passport.request_changes': 'text-lumiris-amber',
    'passport.override': 'text-lumiris-orange',
    'artisan.read': 'text-muted-foreground',
    'artisan.suspend': 'text-lumiris-rose',
    'artisan.contact': 'text-lumiris-cyan',
    'retoucheur.read': 'text-muted-foreground',
    'retoucheur.kyc_verify': 'text-lumiris-emerald',
    'retoucheur.kyc_reject': 'text-lumiris-rose',
    'retoucheur.suspend': 'text-lumiris-rose',
    'retoucheur.review_hide': 'text-lumiris-amber',
    'retoucheur.local_dunning': 'text-lumiris-amber',
    'vision_user.read': 'text-lumiris-cyan',
    'vision_user.gdpr_export': 'text-lumiris-amber',
    'vision_user.gdpr_delete': 'text-lumiris-rose',
    'billing.read': 'text-muted-foreground',
    'billing.dunning': 'text-lumiris-amber',
    'billing.export': 'text-muted-foreground',
    'billing.invoice_issue': 'text-lumiris-cyan',
    'affiliation.read': 'text-muted-foreground',
    'affiliation.prepare_payout': 'text-lumiris-orange',
    'affiliation.rate_change': 'text-lumiris-amber',
    'affiliation.payout_reconcile': 'text-lumiris-emerald',
    'governance.read_audit_log': 'text-muted-foreground',
    'governance.export_audit_log': 'text-lumiris-amber',
    'governance.anomaly_acknowledge': 'text-lumiris-emerald',
    'governance.anomaly_escalate': 'text-lumiris-rose',
};

const ROLE_TONE: Record<AdminUserRole, string> = {
    platform_admin: 'text-lumiris-emerald',
    lead_curator: 'text-lumiris-emerald',
    curator: 'text-lumiris-cyan',
    billing_ops: 'text-lumiris-orange',
    dpo: 'text-lumiris-rose',
};

type Category = 'passport' | 'artisan' | 'repairer' | 'vision_user' | 'billing' | 'affiliation' | 'governance';
type TimeBucket = 'all' | 'business' | 'after_hours' | 'weekend';
type AnomalyStatusFilter = 'all' | AnomalyReviewStatus;

function actionCategory(action: AdminAction): Category {
    return action.split('.')[0] as Category;
}

function inTimeBucket(iso: string, bucket: TimeBucket): boolean {
    if (bucket === 'all') return true;
    const d = new Date(iso);
    const day = d.getDay();
    if (bucket === 'weekend') return day === 0 || day === 6;
    const hour = d.getHours();
    const afterHours = hour >= 22 || hour < 6;
    if (bucket === 'after_hours') return afterHours && day !== 0 && day !== 6;
    return !afterHours && day !== 0 && day !== 6;
}

function GovernanceComponent() {
    return (
        <Suspense fallback={null}>
            <GovernanceBody />
        </Suspense>
    );
}

function GovernanceBody() {
    const auditLog = useAdminAuditLog();
    const log = useLogAction();
    const user = useCurrentUser();
    const canExport = usePermission('governance.export_audit_log');
    const { reviews, setReview } = useAnomalyReviews();
    const searchParams = useSearchParams();
    const focusId = searchParams?.get('focus') ?? null;

    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<AdminUserRole | 'all'>('all');
    const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
    const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');
    const [timeFilter, setTimeFilter] = useState<TimeBucket>('all');
    const [statusFilter, setStatusFilter] = useState<AnomalyStatusFilter>('all');
    const [selected, setSelected] = useState<AdminAuditLogEntry | null>(null);
    const [escalating, setEscalating] = useState<AnomalyAlert | null>(null);

    const entryRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());

    useEffect(() => {
        if (!focusId) return;
        const found = auditLog.find((e) => e.id === focusId);
        if (!found) return;
        setSelected(found);
        const target = entryRefs.current.get(focusId);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [focusId, auditLog]);

    const targetTypes = useMemo(() => {
        const set = new Set(auditLog.map((e) => e.targetType));
        return Array.from(set).sort();
    }, [auditLog]);

    const filtered = useMemo(() => {
        return auditLog.filter((e) => {
            if (roleFilter !== 'all' && e.actorRole !== roleFilter) return false;
            if (categoryFilter !== 'all' && actionCategory(e.action) !== categoryFilter) return false;
            if (targetTypeFilter !== 'all' && e.targetType !== targetTypeFilter) return false;
            if (!inTimeBucket(e.ts, timeFilter)) return false;
            if (search.trim().length > 0) {
                const needle = search.toLowerCase();
                const haystack = `${e.actorId} ${e.targetId} ${e.action} ${JSON.stringify(e.payload)}`.toLowerCase();
                if (!haystack.includes(needle)) return false;
            }
            return true;
        });
    }, [auditLog, roleFilter, categoryFilter, targetTypeFilter, timeFilter, search]);

    const pagination = usePagination(filtered, 100);

    const anomalies = useMemo(() => detectAnomalies(auditLog), [auditLog]);

    const visibleAnomalies = useMemo(() => {
        if (statusFilter === 'all') return anomalies;
        return anomalies.filter((a) => (reviews.get(a.id)?.status ?? 'unreviewed') === statusFilter);
    }, [anomalies, statusFilter, reviews]);

    const handleAcknowledge = (anomaly: AnomalyAlert) => {
        const review: AnomalyReview = {
            status: 'acknowledged',
            reviewedBy: user.id,
            reviewedAt: new Date().toISOString(),
        };
        setReview(anomaly.id, review);
        log({
            action: 'governance.anomaly_acknowledge',
            targetType: 'anomaly',
            targetId: anomaly.id,
            payload: { workflow: 'acknowledged', rule: anomaly.rule, severity: anomaly.severity },
        });
    };

    const handleEscalate = (anomaly: AnomalyAlert, reason: string) => {
        const review: AnomalyReview = {
            status: 'escalated',
            reason,
            reviewedBy: user.id,
            reviewedAt: new Date().toISOString(),
        };
        setReview(anomaly.id, review);
        log({
            action: 'governance.anomaly_escalate',
            targetType: 'anomaly',
            targetId: anomaly.id,
            payload: { workflow: 'escalated', rule: anomaly.rule, severity: anomaly.severity, reason },
        });
        setEscalating(null);
    };

    const handleExport = () => {
        const anomalyByEntryId = new Map<string, AnomalyAlert>();
        for (const a of anomalies) {
            for (const id of a.relatedIds) anomalyByEntryId.set(id, a);
        }
        const header = [
            'ts',
            'actorId',
            'actorRole',
            'action',
            'targetType',
            'targetId',
            'payload',
            'anomalyRule',
            'anomalyStatus',
            'anomalyReason',
        ].join(',');
        const rows = filtered.map((e) => {
            const a = anomalyByEntryId.get(e.id);
            const review = a ? reviews.get(a.id) : undefined;
            return [
                e.ts,
                e.actorId,
                e.actorRole,
                e.action,
                e.targetType,
                e.targetId,
                JSON.stringify(e.payload).replace(/,/g, ';'),
                a?.rule ?? '',
                review?.status ?? (a ? 'unreviewed' : ''),
                (review?.reason ?? '').replace(/,/g, ';'),
            ].join(',');
        });
        const csv = `${header}\n${rows.join('\n')}`;
        log({
            action: 'governance.export_audit_log',
            targetType: 'period',
            targetId: `filter-${Date.now()}`,
            payload: { count: filtered.length, format: 'csv', includesAnomalies: true },
        });
        if (typeof window !== 'undefined') {
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lumiris-audit-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-baseline justify-between gap-3">
                <div>
                    <h2 className="text-foreground text-xl font-semibold">Gouvernance</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Journal d&apos;audit en direct · {auditLog.length} entrées · anomalies détectées en temps réel.
                    </p>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExport}
                    disabled={!canExport}
                    aria-label="Exporter le journal d'audit au format CSV"
                    className="gap-1.5"
                >
                    <Download className="h-3.5 w-3.5" aria-hidden /> Exporter en CSV
                </Button>
            </div>

            <GovernanceBanner />
            <NonNegotiableBanner rule="Journal d'audit immuable. Toute modification serait un délit. Les entrées sont conservées 7 ans conformément à l'AGEC." />

            {anomalies.length > 0 ? (
                <AnomaliesPanel
                    anomalies={visibleAnomalies}
                    reviews={reviews}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    totalAnomalies={anomalies.length}
                    onAcknowledge={handleAcknowledge}
                    onEscalate={(a) => setEscalating(a)}
                />
            ) : null}

            <div className="border-border bg-card flex flex-wrap items-center gap-2 rounded-xl border p-3">
                <div className="min-w-55 relative flex-1">
                    <Search
                        className="text-muted-foreground/60 absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                        aria-hidden
                    />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Identifiant acteur, cible, charge utile…"
                        aria-label="Recherche dans le journal d'audit"
                        className="pl-8"
                    />
                </div>
                <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as AdminUserRole | 'all')}>
                    <SelectTrigger className="w-45">
                        <Filter className="mr-1 h-3.5 w-3.5" /> <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous rôles</SelectItem>
                        <SelectItem value="platform_admin">Admin plateforme</SelectItem>
                        <SelectItem value="lead_curator">Curateur principal</SelectItem>
                        <SelectItem value="curator">Curateur</SelectItem>
                        <SelectItem value="billing_ops">Ops facturation</SelectItem>
                        <SelectItem value="dpo">DPO</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as Category | 'all')}>
                    <SelectTrigger className="w-45">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes catégories</SelectItem>
                        <SelectItem value="passport">passport</SelectItem>
                        <SelectItem value="artisan">artisan</SelectItem>
                        <SelectItem value="retoucheur">retoucheur</SelectItem>
                        <SelectItem value="vision_user">vision_user</SelectItem>
                        <SelectItem value="billing">billing</SelectItem>
                        <SelectItem value="affiliation">affiliation</SelectItem>
                        <SelectItem value="governance">governance</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes cibles</SelectItem>
                        {targetTypes.map((t) => (
                            <SelectItem key={t} value={t}>
                                {t}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeBucket)}>
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes plages</SelectItem>
                        <SelectItem value="business">Heures ouvrées</SelectItem>
                        <SelectItem value="after_hours">Nuit (22h-6h)</SelectItem>
                        <SelectItem value="weekend">Week-end</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="border-border bg-card rounded-xl border">
                <div className="border-border border-b px-4 py-2">
                    <p className="text-muted-foreground text-xs">
                        {filtered.length === 0
                            ? `0 / ${auditLog.length} entrées`
                            : `${pagination.rangeStart}-${pagination.rangeEnd} / ${auditLog.length} entrées`}
                    </p>
                </div>
                <div className="divide-border max-h-160 divide-y overflow-y-auto">
                    {pagination.pageItems.map((entry) => (
                        <button
                            type="button"
                            key={entry.id}
                            ref={(node) => {
                                if (node) entryRefs.current.set(entry.id, node);
                                else entryRefs.current.delete(entry.id);
                            }}
                            onClick={() => setSelected(entry)}
                            className={cn(
                                'hover:bg-muted/30 flex w-full items-start gap-3 px-4 py-2.5 text-left',
                                focusId === entry.id ? 'bg-lumiris-cyan/10 ring-lumiris-cyan/40 ring-1 ring-inset' : '',
                            )}
                        >
                            <span
                                className={cn(
                                    'mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold',
                                    'bg-muted',
                                    ROLE_TONE[entry.actorRole],
                                )}
                            >
                                {entry.actorRole.slice(0, 2).toUpperCase()}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-foreground text-xs">
                                    <span className="font-medium">{entry.actorId}</span>{' '}
                                    <span className={cn('font-mono', ACTION_TONE[entry.action])}>{entry.action}</span>{' '}
                                    <span className="text-muted-foreground">
                                        sur {entry.targetType}/{entry.targetId}
                                    </span>
                                </p>
                                {Object.keys(entry.payload).length > 0 ? (
                                    <p className="text-muted-foreground/80 truncate font-mono text-[10px]">
                                        {JSON.stringify(entry.payload)}
                                    </p>
                                ) : null}
                            </div>
                            <span className="text-muted-foreground/60 shrink-0 font-mono text-[10px]">
                                {new Date(entry.ts).toLocaleString('fr-FR', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        </button>
                    ))}
                    {filtered.length === 0 ? (
                        <div className="text-muted-foreground flex flex-col items-center gap-2 p-6 text-center text-xs">
                            <p>Aucune entrée ne correspond aux filtres.</p>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    setSearch('');
                                    setRoleFilter('all');
                                    setCategoryFilter('all');
                                    setTargetTypeFilter('all');
                                    setTimeFilter('all');
                                }}
                                className="gap-1.5"
                            >
                                <Filter className="h-3.5 w-3.5" aria-hidden /> Réinitialiser les filtres
                            </Button>
                        </div>
                    ) : null}
                </div>
                {filtered.length > 0 ? (
                    <PaginationBar
                        page={pagination.page}
                        pageCount={pagination.pageCount}
                        pageSize={pagination.pageSize}
                        rangeStart={pagination.rangeStart}
                        rangeEnd={pagination.rangeEnd}
                        totalCount={filtered.length}
                        onPageChange={pagination.setPage}
                        label="entrées"
                    />
                ) : null}
            </div>

            <EntryDetail entry={selected} onClose={() => setSelected(null)} />
            <EscalateDialog
                anomaly={escalating}
                onCancel={() => setEscalating(null)}
                onConfirm={(reason) => {
                    if (escalating) handleEscalate(escalating, reason);
                }}
            />
        </div>
    );
}

function AnomaliesPanel({
    anomalies,
    reviews,
    statusFilter,
    onStatusFilterChange,
    totalAnomalies,
    onAcknowledge,
    onEscalate,
}: {
    anomalies: readonly AnomalyAlert[];
    reviews: ReadonlyMap<string, AnomalyReview>;
    statusFilter: AnomalyStatusFilter;
    onStatusFilterChange: (v: AnomalyStatusFilter) => void;
    totalAnomalies: number;
    onAcknowledge: (a: AnomalyAlert) => void;
    onEscalate: (a: AnomalyAlert) => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-lumiris-rose/30 bg-lumiris-rose/5 space-y-3 rounded-xl border p-4"
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-lumiris-rose inline-flex items-center gap-2 text-sm font-semibold">
                    <AlertTriangle className="h-4 w-4" /> Anomalies de gouvernance ({anomalies.length}/{totalAnomalies})
                </div>
                <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as AnomalyStatusFilter)}>
                    <SelectTrigger className="w-44" aria-label="Filtrer par statut d'anomalie">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous statuts</SelectItem>
                        <SelectItem value="unreviewed">Non revu</SelectItem>
                        <SelectItem value="acknowledged">Pris en compte</SelectItem>
                        <SelectItem value="escalated">Escaladé</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {anomalies.length === 0 ? (
                <p className="text-muted-foreground text-xs">Aucune anomalie ne correspond au filtre courant.</p>
            ) : (
                <ul className="space-y-2">
                    {anomalies.map((a) => {
                        const review = reviews.get(a.id);
                        const status: AnomalyReviewStatus = review?.status ?? 'unreviewed';
                        return (
                            <li key={a.id} className="border-border bg-background rounded-lg border p-3 text-xs">
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <p className="text-foreground font-medium">{a.title}</p>
                                    <div className="flex items-center gap-1.5">
                                        <Badge variant="outline" className="font-mono text-[10px]">
                                            {ANOMALY_RULE_LABEL[a.rule]}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                'font-mono text-[10px]',
                                                a.severity === 'error'
                                                    ? 'border-lumiris-rose/40 text-lumiris-rose'
                                                    : 'border-lumiris-amber/40 text-lumiris-amber',
                                            )}
                                        >
                                            {a.severity}
                                        </Badge>
                                        <StatusBadge status={status} />
                                    </div>
                                </div>
                                <p className="text-muted-foreground mt-1">{a.detail}</p>
                                {a.relatedIds.length > 0 ? (
                                    <p className="text-muted-foreground/70 mt-1 font-mono text-[10px]">
                                        identifiants : {a.relatedIds.slice(0, 6).join(', ')}
                                        {a.relatedIds.length > 6 ? '…' : ''}
                                    </p>
                                ) : null}
                                {review?.status === 'escalated' && review.reason ? (
                                    <p className="text-lumiris-rose/90 mt-1 italic">
                                        Escaladé par {review.reviewedBy} : “{review.reason}”
                                    </p>
                                ) : null}
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onAcknowledge(a)}
                                        disabled={status === 'acknowledged'}
                                        aria-label={`Accuser réception de l'anomalie ${a.title}`}
                                        className="h-7 gap-1 text-[11px]"
                                    >
                                        <CheckCircle2 className="h-3 w-3" aria-hidden /> Accuser réception
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onEscalate(a)}
                                        disabled={status === 'escalated'}
                                        aria-label={`Escalader l'anomalie ${a.title}`}
                                        className="border-lumiris-rose/40 text-lumiris-rose h-7 gap-1 text-[11px]"
                                    >
                                        <ShieldAlert className="h-3 w-3" aria-hidden /> Escalader
                                    </Button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </motion.div>
    );
}

function StatusBadge({ status }: { status: AnomalyReviewStatus }) {
    const map: Record<AnomalyReviewStatus, { label: string; cn: string }> = {
        unreviewed: { label: 'Non revu', cn: 'border-muted-foreground/40 text-muted-foreground' },
        acknowledged: { label: 'Pris en compte', cn: 'border-lumiris-emerald/40 text-lumiris-emerald' },
        escalated: { label: 'Escaladé', cn: 'border-lumiris-rose/40 text-lumiris-rose' },
    };
    const { label, cn: tone } = map[status];
    return (
        <Badge variant="outline" className={cn('font-mono text-[10px]', tone)}>
            {label}
        </Badge>
    );
}

const ESCALATE_CONFIRMATION = 'ESCALADER';

function EscalateDialog({
    anomaly,
    onCancel,
    onConfirm,
}: {
    anomaly: AnomalyAlert | null;
    onCancel: () => void;
    onConfirm: (reason: string) => void;
}) {
    const [reason, setReason] = useState('');
    const [typed, setTyped] = useState('');
    const isMajor = anomaly?.severity === 'error';
    const typedOk = !isMajor || typed.trim().toUpperCase() === ESCALATE_CONFIRMATION;
    const reasonOk = reason.trim().length >= 20;
    return (
        <AlertDialog
            open={anomaly !== null}
            onOpenChange={(open) => {
                if (!open) {
                    setReason('');
                    setTyped('');
                    onCancel();
                }
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-lumiris-rose">Escalader l&apos;anomalie</AlertDialogTitle>
                    <AlertDialogDescription>
                        {anomaly ? anomaly.title : ''}
                        <br />
                        Décrivez la raison de l&apos;escalade - elle sera attachée à l&apos;entrée du journal
                        d&apos;audit et visible par toute l&apos;équipe gouvernance.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    aria-label="Motif de l'escalade"
                    className="min-h-24"
                    placeholder="Motif de l'escalade (compte compromis suspecté, double validation, etc.)"
                />
                <p
                    className={cn(
                        'text-right font-mono text-[10px]',
                        reasonOk ? 'text-lumiris-emerald' : 'text-muted-foreground',
                    )}
                >
                    {reason.trim().length} / 20
                </p>
                {isMajor ? (
                    <div className="border-lumiris-rose/30 bg-lumiris-rose/5 space-y-2 rounded-lg border p-3">
                        <label htmlFor="escalate-typed" className="text-lumiris-rose block text-[11px] font-medium">
                            Anomalie majeure — saisissez <span className="font-mono">{ESCALATE_CONFIRMATION}</span> pour
                            confirmer l&apos;escalade.
                        </label>
                        <input
                            id="escalate-typed"
                            type="text"
                            value={typed}
                            onChange={(e) => setTyped(e.target.value)}
                            placeholder={ESCALATE_CONFIRMATION}
                            aria-label="Confirmation d'escalade — saisissez le mot de confirmation"
                            className="border-border bg-background text-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 font-mono text-xs outline-none focus-visible:ring-2"
                        />
                    </div>
                ) : null}
                <AlertDialogFooter>
                    <AlertDialogCancel
                        onClick={() => {
                            setReason('');
                            setTyped('');
                        }}
                    >
                        Annuler
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => {
                            if (reasonOk && typedOk) {
                                onConfirm(reason.trim());
                                setReason('');
                                setTyped('');
                            }
                        }}
                        disabled={!reasonOk || !typedOk}
                        className="bg-lumiris-rose hover:bg-lumiris-rose/90"
                    >
                        Confirmer l&apos;escalade
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function EntryDetail({ entry, onClose }: { entry: AdminAuditLogEntry | null; onClose: () => void }) {
    return (
        <Sheet open={entry !== null} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="bg-background w-full overflow-hidden p-0 sm:max-w-lg">
                {entry ? (
                    <>
                        <SheetHeader className="border-border border-b p-5">
                            <SheetTitle className="font-mono text-sm">{entry.action}</SheetTitle>
                            <p className="text-muted-foreground text-xs">
                                {new Date(entry.ts).toLocaleString('fr-FR')}
                            </p>
                        </SheetHeader>
                        <ScrollArea className="flex-1">
                            <div className="space-y-3 p-5 text-xs">
                                <Section label="Acteur">
                                    <p className="text-foreground">
                                        {entry.actorId}{' '}
                                        <span className={cn('font-mono', ROLE_TONE[entry.actorRole])}>
                                            ({entry.actorRole})
                                        </span>
                                    </p>
                                </Section>
                                <Section label="Cible">
                                    <p className="text-foreground font-mono">
                                        {entry.targetType} / {entry.targetId}
                                    </p>
                                </Section>
                                <Section label="IP (mock)">
                                    <p className="text-foreground font-mono">{entry.ipMock ?? '-'}</p>
                                </Section>
                                <Section label="Payload">
                                    <pre className="text-foreground bg-muted/40 overflow-x-auto rounded-lg p-3 font-mono text-[11px]">
                                        {JSON.stringify(entry.payload, null, 2)}
                                    </pre>
                                </Section>
                                <p className="text-muted-foreground/70 inline-flex items-center gap-1 font-mono text-[10px]">
                                    <History className="h-3 w-3" /> id {entry.id}
                                </p>
                            </div>
                        </ScrollArea>
                    </>
                ) : null}
            </SheetContent>
        </Sheet>
    );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</p>
            <div className="text-foreground mt-1">{children}</div>
        </div>
    );
}

export const Governance = memo(GovernanceComponent);
