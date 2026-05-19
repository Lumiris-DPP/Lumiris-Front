import { Governance } from '@/features/governance';
import { PermissionGate } from '@/features/_shared/permission-gate';

export default function GouvernancePage() {
    return (
        <PermissionGate requires="governance.read_audit_log">
            <Governance />
        </PermissionGate>
    );
}
