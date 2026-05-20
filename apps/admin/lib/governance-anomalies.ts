import type { AdminAction, AdminAuditLogEntry, AdminUserRole } from '@lumiris/types';

export interface AnomalyAlert {
    id: string;
    severity: 'warn' | 'error';
    rule: AnomalyRule;
    title: string;
    detail: string;
    relatedIds: readonly string[];
}

export type AnomalyRule =
    | 'actor_burst'
    | 'override_grade_jump'
    | 'chain_validation'
    | 'override_then_validate'
    | 'bursting'
    | 'cross_role'
    | 'sensitive_after_hours';

export const SENSITIVE_ACTIONS = new Set<AdminAction>([
    'passport.override',
    'passport.flag',
    'artisan.suspend',
    'retoucheur.suspend',
    'vision_user.gdpr_export',
    'vision_user.gdpr_delete',
    'billing.dunning',
]);

const HOUR_MS = 60 * 60 * 1000;
const FIVE_MIN_MS = 5 * 60 * 1000;
const TEN_MIN_MS = 10 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * HOUR_MS;
const GRADE_RANK: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1 };

/** Mappe une action sur sa famille de rôle pour détecter les acteurs transversaux. */
const ROLE_FAMILY: Record<AdminAction, AdminUserRole | null> = {
    'passport.read': null,
    'passport.curate': 'curator',
    'passport.validate': 'curator',
    'passport.flag': 'curator',
    'passport.request_changes': 'curator',
    'passport.override': 'lead_curator',
    'artisan.read': null,
    'artisan.suspend': 'platform_admin',
    'artisan.contact': 'curator',
    'retoucheur.read': null,
    'retoucheur.kyc_verify': 'platform_admin',
    'retoucheur.kyc_reject': 'platform_admin',
    'retoucheur.suspend': 'platform_admin',
    'retoucheur.review_hide': 'platform_admin',
    'retoucheur.local_dunning': 'billing_ops',
    'vision_user.read': 'dpo',
    'vision_user.gdpr_export': 'dpo',
    'vision_user.gdpr_delete': 'dpo',
    'billing.read': null,
    'billing.dunning': 'billing_ops',
    'billing.export': 'billing_ops',
    'billing.invoice_issue': 'billing_ops',
    'affiliation.read': null,
    'affiliation.prepare_payout': 'billing_ops',
    'affiliation.rate_change': 'platform_admin',
    'affiliation.payout_reconcile': 'billing_ops',
    'governance.read_audit_log': null,
    'governance.export_audit_log': 'platform_admin',
    'governance.anomaly_acknowledge': 'platform_admin',
    'governance.anomaly_escalate': 'platform_admin',
};

function isAfterHours(iso: string): boolean {
    const d = new Date(iso);
    const day = d.getDay();
    if (day === 0 || day === 6) return true;
    const hour = d.getHours();
    return hour >= 22 || hour < 6;
}

export function detectAnomalies(auditLog: readonly AdminAuditLogEntry[]): readonly AnomalyAlert[] {
    const alerts: AnomalyAlert[] = [];
    const now = Date.now();

    const recentSensitive = auditLog.filter(
        (e) => SENSITIVE_ACTIONS.has(e.action) && now - new Date(e.ts).getTime() < HOUR_MS,
    );
    const byActorHour = new Map<string, AdminAuditLogEntry[]>();
    for (const entry of recentSensitive) {
        const list = byActorHour.get(entry.actorId) ?? [];
        list.push(entry);
        byActorHour.set(entry.actorId, list);
    }
    for (const [actorId, entries] of byActorHour.entries()) {
        if (entries.length > 10) {
            alerts.push({
                id: `actor-burst-${actorId}`,
                rule: 'actor_burst',
                severity: 'error',
                title: `${actorId} a effectué ${entries.length} actions sensibles en < 1h`,
                detail: "Velocity excessive - vérifier que le compte n'est pas compromis.",
                relatedIds: entries.map((e) => e.id),
            });
        }
    }

    for (const entry of auditLog) {
        if (entry.action !== 'passport.override') continue;
        const from = entry.payload.from as string | undefined;
        const to = entry.payload.to as string | undefined;
        const reason = entry.payload.reason as string | undefined;
        if (!from || !to) continue;
        const fromRank = GRADE_RANK[from] ?? 0;
        const toRank = GRADE_RANK[to] ?? 0;
        if (toRank - fromRank >= 2) {
            alerts.push({
                id: `override-jump-${entry.id}`,
                rule: 'override_grade_jump',
                severity: 'warn',
                title: `Override remontant le grade ${from} → ${to}`,
                detail: `Justification : ${reason ?? '(non précisée)'}. Vérifier que la preuve documentaire suit.`,
                relatedIds: [entry.id, entry.targetId],
            });
        }
    }

    const validationsByArtisan = new Map<string, AdminAuditLogEntry[]>();
    for (const entry of auditLog) {
        if (entry.action !== 'passport.curate') continue;
        const artisanId =
            entry.targetType === 'artisan' ? entry.targetId : (entry.payload.artisanId as string | undefined);
        if (!artisanId) continue;
        const list = validationsByArtisan.get(artisanId) ?? [];
        list.push(entry);
        validationsByArtisan.set(artisanId, list);
    }
    for (const [artisanId, entries] of validationsByArtisan.entries()) {
        const sorted = [...entries].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
        for (let i = 0; i < sorted.length - 3; i++) {
            const window = sorted.slice(i, i + 4);
            const first = window[0];
            const last = window[3];
            if (!first || !last) continue;
            const span = new Date(last.ts).getTime() - new Date(first.ts).getTime();
            if (span < FIVE_MIN_MS) {
                alerts.push({
                    id: `chain-validation-${artisanId}-${first.id}`,
                    rule: 'chain_validation',
                    severity: 'warn',
                    title: `4 validations en chaîne pour ${artisanId} (< 5 min)`,
                    detail: 'Suspicion de validation expéditive - repasser les passeports en revue.',
                    relatedIds: window.map((e) => e.id),
                });
                break;
            }
        }
    }

    const passportEvents = new Map<string, AdminAuditLogEntry[]>();
    for (const entry of auditLog) {
        if (entry.targetType !== 'passport') continue;
        if (entry.action !== 'passport.override' && entry.action !== 'passport.curate') continue;
        const list = passportEvents.get(entry.targetId) ?? [];
        list.push(entry);
        passportEvents.set(entry.targetId, list);
    }
    for (const [passportId, entries] of passportEvents.entries()) {
        const sorted = [...entries].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
        for (let i = 0; i < sorted.length - 1; i++) {
            const a = sorted[i];
            const b = sorted[i + 1];
            if (!a || !b) continue;
            if (a.action !== 'passport.override' || b.action !== 'passport.curate') continue;
            if (a.actorId !== b.actorId) continue;
            const span = new Date(b.ts).getTime() - new Date(a.ts).getTime();
            if (span >= 0 && span < FIVE_MIN_MS) {
                alerts.push({
                    id: `override-then-validate-${passportId}-${a.id}`,
                    rule: 'override_then_validate',
                    severity: 'error',
                    title: `${a.actorId} a override puis validé ${passportId} en ${Math.round(span / 1000)}s`,
                    detail: "Override suivi d'une validation rapide par le même curateur - flux à figer en revue à 4 yeux.",
                    relatedIds: [a.id, b.id, passportId],
                });
            }
        }
    }

    const sensitiveByActor = new Map<string, AdminAuditLogEntry[]>();
    for (const entry of auditLog) {
        if (!SENSITIVE_ACTIONS.has(entry.action)) continue;
        const list = sensitiveByActor.get(entry.actorId) ?? [];
        list.push(entry);
        sensitiveByActor.set(entry.actorId, list);
    }
    for (const [actorId, entries] of sensitiveByActor.entries()) {
        const sorted = [...entries].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
        for (let i = 0; i < sorted.length; i++) {
            const start = sorted[i];
            if (!start) continue;
            const startTs = new Date(start.ts).getTime();
            const window = sorted.filter((e) => {
                const t = new Date(e.ts).getTime();
                return t >= startTs && t - startTs <= TEN_MIN_MS;
            });
            if (window.length > 8) {
                alerts.push({
                    id: `bursting-${actorId}-${start.id}`,
                    rule: 'bursting',
                    severity: 'error',
                    title: `${actorId} : ${window.length} actions sensibles en < 10 min`,
                    detail: "Pattern de bursting - figer le compte le temps d'une revue manuelle.",
                    relatedIds: window.map((e) => e.id),
                });
                break;
            }
        }
    }

    const recentByActor = new Map<string, AdminAuditLogEntry[]>();
    for (const entry of auditLog) {
        if (now - new Date(entry.ts).getTime() > SEVEN_DAYS_MS) continue;
        if (ROLE_FAMILY[entry.action] === null) continue;
        const list = recentByActor.get(entry.actorId) ?? [];
        list.push(entry);
        recentByActor.set(entry.actorId, list);
    }
    for (const [actorId, entries] of recentByActor.entries()) {
        const families = new Set<AdminUserRole>();
        for (const entry of entries) {
            const fam = ROLE_FAMILY[entry.action];
            if (fam) families.add(fam);
        }
        if (families.size >= 3) {
            alerts.push({
                id: `cross-role-${actorId}`,
                rule: 'cross_role',
                severity: 'warn',
                title: `${actorId} a exercé ${families.size} rôles distincts sur 7j`,
                detail: `Familles touchées : ${Array.from(families).join(', ')}. Vérifier la séparation des privilèges.`,
                relatedIds: entries.map((e) => e.id),
            });
        }
    }

    for (const entry of auditLog) {
        if (!SENSITIVE_ACTIONS.has(entry.action)) continue;
        if (!isAfterHours(entry.ts)) continue;
        const reason = (entry.payload.reason as string | undefined) ?? '';
        if (reason.trim().length >= 30) continue;
        alerts.push({
            id: `after-hours-${entry.id}`,
            rule: 'sensitive_after_hours',
            severity: 'warn',
            title: `Action sensible hors heures ouvrées (${entry.action})`,
            detail: `Effectuée par ${entry.actorId} avec justification < 30 caractères. Demander une motivation complète.`,
            relatedIds: [entry.id],
        });
    }

    return alerts;
}

export const ANOMALY_RULE_LABEL: Record<AnomalyRule, string> = {
    actor_burst: 'Burst d’actions sensibles (> 10 / 1 h)',
    override_grade_jump: 'Override avec saut de 2 grades',
    chain_validation: 'Validations en chaîne (4 / < 5 min)',
    override_then_validate: 'Override + validation rapide',
    bursting: 'Bursting (> 8 actions / 10 min)',
    cross_role: 'Cross-role sur 7 jours',
    sensitive_after_hours: 'Action sensible hors heures',
};
