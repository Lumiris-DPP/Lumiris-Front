import { AuditFeature } from '@/features/audit';
import { PermissionGate } from '@/features/_shared/permission-gate';

export default function AuditPage() {
    return (
        <PermissionGate requires="governance.read_audit_log">
            <AuditFeature />
        </PermissionGate>
    );
}
