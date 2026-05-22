import { ConformiteESPR } from '@/features/conformite-espr';
import { PermissionGate } from '@/features/_shared/permission-gate';

export default function ConformitePage() {
    return (
        <PermissionGate requires="governance.read_audit_log">
            <ConformiteESPR />
        </PermissionGate>
    );
}
