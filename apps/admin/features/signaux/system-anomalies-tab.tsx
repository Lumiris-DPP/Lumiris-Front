'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { Textarea } from '@lumiris/ui/components/textarea';
import { cn } from '@lumiris/ui/lib/cn';
import {
    useAdminAuditLog,
    useAnomalyReviews,
    useCurrentUser,
    useLogAction,
    type AnomalyReview,
    type AnomalyReviewStatus,
} from '@/lib/auth';
import { ANOMALY_RULE_LABEL, detectAnomalies, type AnomalyAlert } from '@/lib/governance-anomalies';
import { ANOMALY_STATUS_LABEL, type AnomalyStatusFilter } from '@/features/_shared/action-status';

export function SystemAnomaliesTab() {
    const auditLog = useAdminAuditLog();
    const log = useLogAction();
    const user = useCurrentUser();
    const { reviews, setReview } = useAnomalyReviews();

    const [statusFilter, setStatusFilter] = useState<AnomalyStatusFilter>('all');
    const [escalating, setEscalating] = useState<AnomalyAlert | null>(null);

    const anomalies = useMemo(() => detectAnomalies(auditLog), [auditLog]);
    const visibleAnomalies = useMemo(() => {
        if (statusFilter === 'all') return anomalies;
        return anomalies.filter((a) => (reviews.get(a.id)?.status ?? 'unreviewed') === statusFilter);
    }, [anomalies, statusFilter, reviews]);

    const handleAcknowledge = (anomaly: AnomalyAlert) => {
        if (!user) return;
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
        if (!user) return;
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

    if (anomalies.length === 0) {
        return (
            <p className="p-6 text-center text-xs text-muted-foreground">
                Aucune anomalie détectée sur la période analysée.
            </p>
        );
    }

    return (
        <div className="space-y-3 rounded-xl border border-lumiris-rose/30 bg-lumiris-rose/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-lumiris-rose">
                    <AlertTriangle className="h-4 w-4" /> Anomalies ({visibleAnomalies.length}/{anomalies.length})
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AnomalyStatusFilter)}>
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
            {visibleAnomalies.length === 0 ? (
                <p className="text-xs text-muted-foreground">Aucune anomalie ne correspond au filtre courant.</p>
            ) : (
                <ul className="space-y-2">
                    {visibleAnomalies.map((a) => {
                        const review = reviews.get(a.id);
                        const status: AnomalyReviewStatus = review?.status ?? 'unreviewed';
                        const statusMeta = ANOMALY_STATUS_LABEL[status];
                        return (
                            <li key={a.id} className="rounded-lg border border-border bg-background p-3 text-xs">
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <p className="font-medium text-foreground">{a.title}</p>
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
                                        <Badge
                                            variant="outline"
                                            className={cn('font-mono text-[10px]', statusMeta.tone)}
                                        >
                                            {statusMeta.label}
                                        </Badge>
                                    </div>
                                </div>
                                <p className="mt-1 text-muted-foreground">{a.detail}</p>
                                {a.relatedIds.length > 0 ? (
                                    <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">
                                        identifiants : {a.relatedIds.slice(0, 6).join(', ')}
                                        {a.relatedIds.length > 6 ? '…' : ''}
                                    </p>
                                ) : null}
                                {review?.status === 'escalated' && review.reason ? (
                                    <p className="mt-1 text-lumiris-rose/90 italic">
                                        Escaladé par {review.reviewedBy} : “{review.reason}”
                                    </p>
                                ) : null}
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleAcknowledge(a)}
                                        disabled={status === 'acknowledged'}
                                        aria-label={`Accuser réception de l'anomalie ${a.title}`}
                                        className="h-7 gap-1 text-[11px]"
                                    >
                                        <CheckCircle2 className="h-3 w-3" aria-hidden /> Accuser réception
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEscalating(a)}
                                        disabled={status === 'escalated'}
                                        aria-label={`Escalader l'anomalie ${a.title}`}
                                        className="h-7 gap-1 border-lumiris-rose/40 text-[11px] text-lumiris-rose"
                                    >
                                        <ShieldAlert className="h-3 w-3" aria-hidden /> Escalader
                                    </Button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

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
    return (
        <AlertDialog
            open={anomaly !== null}
            onOpenChange={(open) => {
                if (!open) {
                    setReason('');
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
                        Décrivez la raison de l&apos;escalade — elle sera attachée à l&apos;entrée du journal
                        d&apos;audit.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    aria-label="Motif de l'escalade"
                    className="min-h-24"
                    placeholder="Motif de l'escalade (compte compromis suspecté, double validation, etc.)"
                />
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setReason('')}>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => {
                            const trimmed = reason.trim();
                            if (trimmed.length === 0) return;
                            onConfirm(trimmed);
                            setReason('');
                        }}
                        className="bg-lumiris-rose hover:bg-lumiris-rose/90"
                    >
                        Confirmer
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
