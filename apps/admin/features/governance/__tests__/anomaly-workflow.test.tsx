import { describe, expect, it } from 'bun:test';
import type { AnomalyRule } from '../../../lib/governance-anomalies';

type AnomalySeverity = 'warn' | 'error';

type AnomalyStatus = 'unreviewed' | 'acknowledged' | 'escalated';

interface AnomalyReview {
    status: 'acknowledged' | 'escalated';
    reviewedBy: string;
    reviewedAt: string;
    reason?: string;
}

interface AnomalyAlert {
    id: string;
    rule: AnomalyRule;
    severity: AnomalySeverity;
}

interface AuditEntry {
    action: 'governance.anomaly_acknowledge' | 'governance.anomaly_escalate';
    targetType: 'anomaly';
    targetId: string;
    payload: {
        workflow: 'acknowledged' | 'escalated';
        rule: AnomalyRule;
        severity: AnomalySeverity;
        reason?: string;
    };
}

function readStatus(reviews: Map<string, AnomalyReview>, anomalyId: string): AnomalyStatus {
    return reviews.get(anomalyId)?.status ?? 'unreviewed';
}

function acknowledge(
    reviews: Map<string, AnomalyReview>,
    log: AuditEntry[],
    anomaly: AnomalyAlert,
    actorId: string,
    now: string,
): void {
    reviews.set(anomaly.id, { status: 'acknowledged', reviewedBy: actorId, reviewedAt: now });
    log.push({
        action: 'governance.anomaly_acknowledge',
        targetType: 'anomaly',
        targetId: anomaly.id,
        payload: { workflow: 'acknowledged', rule: anomaly.rule, severity: anomaly.severity },
    });
}

function escalate(
    reviews: Map<string, AnomalyReview>,
    log: AuditEntry[],
    anomaly: AnomalyAlert,
    reason: string,
    actorId: string,
    now: string,
): void {
    reviews.set(anomaly.id, { status: 'escalated', reviewedBy: actorId, reviewedAt: now, reason });
    log.push({
        action: 'governance.anomaly_escalate',
        targetType: 'anomaly',
        targetId: anomaly.id,
        payload: { workflow: 'escalated', rule: anomaly.rule, severity: anomaly.severity, reason },
    });
}

const ANOMALY: AnomalyAlert = {
    id: 'ANO-001',
    rule: 'override_then_validate',
    severity: 'error',
};

describe('Anomaly workflow', () => {
    it('état initial = unreviewed (review absente du store)', () => {
        const reviews = new Map<string, AnomalyReview>();
        expect(readStatus(reviews, 'ANO-001')).toBe('unreviewed');
    });

    it('unreviewed → acknowledged : status mis à jour + 1 audit entry', () => {
        const reviews = new Map<string, AnomalyReview>();
        const log: AuditEntry[] = [];
        acknowledge(reviews, log, ANOMALY, 'CUR-001', '2026-04-30T10:00:00Z');
        expect(readStatus(reviews, 'ANO-001')).toBe('acknowledged');
        expect(log).toHaveLength(1);
        expect(log[0]?.action).toBe('governance.anomaly_acknowledge');
        expect(log[0]?.payload.workflow).toBe('acknowledged');
    });

    it('unreviewed → escalated : status mis à jour + 1 audit entry avec reason', () => {
        const reviews = new Map<string, AnomalyReview>();
        const log: AuditEntry[] = [];
        escalate(reviews, log, ANOMALY, "Conflit d'intérêt suspecté", 'CUR-002', '2026-04-30T11:00:00Z');
        expect(readStatus(reviews, 'ANO-001')).toBe('escalated');
        expect(log).toHaveLength(1);
        expect(log[0]?.payload.reason).toBe("Conflit d'intérêt suspecté");
    });

    it('audit log meta-tracé : rule + severity portées dans payload pour chaque transition', () => {
        const reviews = new Map<string, AnomalyReview>();
        const log: AuditEntry[] = [];
        acknowledge(reviews, log, ANOMALY, 'CUR-001', '2026-04-30T10:00:00Z');
        expect(log[0]?.payload.rule).toBe('override_then_validate');
        expect(log[0]?.payload.severity).toBe('error');
    });

    it('acknowledged → escalated : escalade après ack (workflow complet)', () => {
        const reviews = new Map<string, AnomalyReview>();
        const log: AuditEntry[] = [];
        acknowledge(reviews, log, ANOMALY, 'CUR-001', '2026-04-30T10:00:00Z');
        escalate(reviews, log, ANOMALY, 'Récidive sur autre passeport', 'CUR-002', '2026-04-30T11:00:00Z');
        expect(readStatus(reviews, 'ANO-001')).toBe('escalated');
        expect(log).toHaveLength(2);
        expect(log[0]?.action).toBe('governance.anomaly_acknowledge');
        expect(log[1]?.action).toBe('governance.anomaly_escalate');
    });

    it('reviewedAt + reviewedBy capturés sur chaque transition', () => {
        const reviews = new Map<string, AnomalyReview>();
        const log: AuditEntry[] = [];
        acknowledge(reviews, log, ANOMALY, 'CUR-XYZ', '2026-04-30T10:00:00Z');
        const stored = reviews.get('ANO-001');
        expect(stored?.reviewedBy).toBe('CUR-XYZ');
        expect(stored?.reviewedAt).toBe('2026-04-30T10:00:00Z');
    });
});
