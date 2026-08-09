import type { AdminAction, AdminUserRole } from '@lumiris/types';
import type { AnomalyReviewStatus } from '@/lib/auth';

export const ACTION_TONE: Record<AdminAction, string> = {
    'passport.read': 'text-muted-foreground',
    'passport.curate': 'text-lumiris-cyan',
    'passport.validate': 'text-lumiris-emerald',
    'passport.flag': 'text-lumiris-rose',
    'passport.request_changes': 'text-lumiris-amber',
    'passport.override': 'text-lumiris-amber',
    'artisan.read': 'text-muted-foreground',
    'artisan.kyc_verify': 'text-lumiris-emerald',
    'artisan.kyc_reject': 'text-lumiris-rose',
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
    'dispute.read': 'text-muted-foreground',
    'dispute.arbitrate': 'text-lumiris-amber',
    'affiliation.read': 'text-muted-foreground',
    'affiliation.prepare_payout': 'text-lumiris-amber',
    'affiliation.rate_change': 'text-lumiris-amber',
    'affiliation.payout_reconcile': 'text-lumiris-emerald',
    'governance.read_audit_log': 'text-muted-foreground',
    'governance.export_audit_log': 'text-lumiris-amber',
    'governance.anomaly_acknowledge': 'text-lumiris-emerald',
    'governance.anomaly_escalate': 'text-lumiris-rose',
    'auth.signin': 'text-muted-foreground',
    'auth.signin_failed': 'text-lumiris-amber',
    'auth.signout': 'text-muted-foreground',
};

export const ROLE_TONE: Record<AdminUserRole, string> = {
    platform_admin: 'text-lumiris-emerald',
    lead_curator: 'text-lumiris-emerald',
    curator: 'text-lumiris-cyan',
    billing_ops: 'text-lumiris-amber',
    dpo: 'text-lumiris-rose',
};

export const ANOMALY_STATUS_LABEL: Record<AnomalyReviewStatus, { label: string; tone: string }> = {
    unreviewed: { label: 'Non revu', tone: 'border-muted-foreground/40 text-muted-foreground' },
    acknowledged: { label: 'Pris en compte', tone: 'border-lumiris-emerald/40 text-lumiris-emerald' },
    escalated: { label: 'Escaladé', tone: 'border-lumiris-rose/40 text-lumiris-rose' },
};

export type Category = 'passport' | 'artisan' | 'retoucheur' | 'vision_user' | 'billing' | 'affiliation' | 'governance';

export type TimeBucket = 'all' | 'business' | 'after_hours' | 'weekend';

export type AnomalyStatusFilter = 'all' | AnomalyReviewStatus;

export const CATEGORY_LABEL: Record<Category, string> = {
    passport: 'Passeports',
    artisan: 'Artisans',
    retoucheur: 'Retoucheurs',
    vision_user: 'Utilisateurs VISION',
    billing: 'Facturation',
    affiliation: 'Affiliation',
    governance: 'Gouvernance',
};

export const ROLE_LABEL: Record<AdminUserRole, string> = {
    platform_admin: 'Admin plateforme',
    lead_curator: 'Curateur principal',
    curator: 'Curateur',
    billing_ops: 'Ops facturation',
    dpo: 'DPO',
};

export function actionCategory(action: AdminAction): Category {
    return action.split('.')[0] as Category;
}

export function inTimeBucket(iso: string, bucket: TimeBucket): boolean {
    if (bucket === 'all') return true;
    const d = new Date(iso);
    const day = d.getDay();
    if (bucket === 'weekend') return day === 0 || day === 6;
    const hour = d.getHours();
    const afterHours = hour >= 22 || hour < 6;
    if (bucket === 'after_hours') return afterHours && day !== 0 && day !== 6;
    return !afterHours && day !== 0 && day !== 6;
}
