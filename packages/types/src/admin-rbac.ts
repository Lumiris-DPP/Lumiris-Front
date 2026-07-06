export type AdminUserRole = 'curator' | 'lead_curator' | 'billing_ops' | 'platform_admin' | 'dpo';

export type AdminAction =
    | 'passport.read'
    | 'passport.curate'
    | 'passport.validate'
    | 'passport.flag'
    | 'passport.request_changes'
    | 'passport.override'
    | 'artisan.read'
    | 'artisan.kyc_verify'
    | 'artisan.kyc_reject'
    | 'artisan.suspend'
    | 'artisan.contact'
    | 'retoucheur.read'
    | 'retoucheur.kyc_verify'
    | 'retoucheur.kyc_reject'
    | 'retoucheur.suspend'
    | 'retoucheur.review_hide'
    | 'retoucheur.local_dunning'
    | 'vision_user.read'
    | 'vision_user.gdpr_export'
    | 'vision_user.gdpr_delete'
    | 'billing.read'
    | 'billing.dunning'
    | 'billing.export'
    | 'billing.invoice_issue'
    | 'affiliation.read'
    | 'affiliation.prepare_payout'
    | 'affiliation.rate_change'
    | 'affiliation.payout_reconcile'
    | 'governance.read_audit_log'
    | 'governance.export_audit_log'
    | 'governance.anomaly_acknowledge'
    | 'governance.anomaly_escalate'
    | 'auth.signin'
    | 'auth.signin_failed'
    | 'auth.signout';

export interface AdminUser {
    id: string;
    email: string;
    fullName: string;
    role: AdminUserRole;
    avatarUrl?: string;
    createdAt: string;
    lastSeenAt?: string;
}

export interface AdminAuditLogEntry {
    id: string;
    ts: string;
    actorId: string;
    actorRole: AdminUserRole;
    action: AdminAction;
    targetType: string;
    targetId: string;
    payload: Record<string, unknown>;
    ipMock?: string;
}
