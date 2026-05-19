// admin RBAC - distinct de `User.role` (consumer/artisan), modélise l'identité back-office

export type AdminUserRole = 'curator' | 'lead_curator' | 'billing_ops' | 'platform_admin' | 'dpo';

export type AdminAction =
    | 'passport.read'
    | 'passport.curate'
    | 'passport.validate' // action audit log — curator+, dispatch côté validate-dialog
    | 'passport.flag'
    | 'passport.request_changes'
    | 'passport.override' // action audit log — lead_curator/platform_admin
    | 'artisan.read'
    | 'artisan.suspend'
    | 'artisan.contact'
    | 'retoucheur.read'
    | 'retoucheur.kyc_verify' // action audit log — platform_admin
    | 'retoucheur.kyc_reject' // action audit log — platform_admin
    | 'retoucheur.suspend'
    | 'retoucheur.review_hide' // action audit log — platform_admin
    | 'retoucheur.local_dunning' // action audit log — billing_ops, relance abonnement Local
    | 'vision_user.read'
    | 'vision_user.gdpr_export' // action audit log — dpo
    | 'vision_user.gdpr_delete' // action audit log — dpo
    | 'billing.read'
    | 'billing.dunning'
    | 'billing.export'
    | 'billing.invoice_issue' // action audit log — billing_ops, émission manuelle d'une facture
    | 'affiliation.read'
    | 'affiliation.prepare_payout'
    | 'affiliation.rate_change' // action audit log — platform_admin, modif d'un taux d'affiliation
    | 'affiliation.payout_reconcile' // action audit log — billing_ops, validation d'un payout
    | 'governance.read_audit_log'
    | 'governance.export_audit_log'
    | 'governance.anomaly_acknowledge' // action audit log — platform_admin, ack d'une anomalie audit
    | 'governance.anomaly_escalate'; // action audit log — platform_admin, escalade vers DPO/legal

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
