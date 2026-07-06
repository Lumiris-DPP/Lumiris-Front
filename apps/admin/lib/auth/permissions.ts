'use client';

import type { AdminAction, AdminUserRole } from '@lumiris/types';
import { useCurrentUser } from './current-user';

const ROLE_PERMISSIONS: Record<AdminUserRole, ReadonlySet<AdminAction>> = {
    curator: new Set<AdminAction>([
        'passport.read',
        'passport.curate',
        'passport.validate',
        'passport.flag',
        'passport.request_changes',
        'artisan.read',
        'artisan.kyc_verify',
        'artisan.kyc_reject',
        'artisan.contact',
        'governance.read_audit_log',
    ]),
    lead_curator: new Set<AdminAction>([
        'passport.read',
        'passport.curate',
        'passport.validate',
        'passport.flag',
        'passport.request_changes',
        'passport.override',
        'artisan.read',
        'artisan.kyc_verify',
        'artisan.kyc_reject',
        'artisan.contact',
        'governance.read_audit_log',
    ]),
    billing_ops: new Set<AdminAction>([
        'billing.read',
        'billing.dunning',
        'billing.export',
        'billing.invoice_issue',
        'affiliation.read',
        'affiliation.prepare_payout',
        'affiliation.payout_reconcile',
        'artisan.read',
        'retoucheur.read',
    ]),
    platform_admin: new Set<AdminAction>([
        'passport.read',
        'passport.curate',
        'passport.validate',
        'passport.flag',
        'passport.request_changes',
        'passport.override',
        'artisan.read',
        'artisan.kyc_verify',
        'artisan.kyc_reject',
        'artisan.suspend',
        'artisan.contact',
        'retoucheur.read',
        'retoucheur.kyc_verify',
        'retoucheur.suspend',
        'retoucheur.review_hide',
        'vision_user.read',
        'vision_user.gdpr_export',
        'vision_user.gdpr_delete',
        'billing.read',
        'billing.dunning',
        'billing.export',
        'billing.invoice_issue',
        'affiliation.read',
        'affiliation.prepare_payout',
        'affiliation.rate_change',
        'affiliation.payout_reconcile',
        'governance.read_audit_log',
        'governance.export_audit_log',
        'governance.anomaly_acknowledge',
        'governance.anomaly_escalate',
    ]),
    dpo: new Set<AdminAction>([
        'vision_user.read',
        'vision_user.gdpr_export',
        'vision_user.gdpr_delete',
        'governance.read_audit_log',
        'governance.export_audit_log',
    ]),
};

export function can(role: AdminUserRole, action: AdminAction): boolean {
    return ROLE_PERMISSIONS[role].has(action);
}

export function usePermission(action: AdminAction): boolean {
    const user = useCurrentUser();
    if (!user) return false;
    return can(user.role, action);
}
