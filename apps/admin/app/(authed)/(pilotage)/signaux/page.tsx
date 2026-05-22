import { Signaux } from '@/features/signaux';
import { PermissionGate } from '@/features/_shared/permission-gate';

export default function SignauxPage() {
    return (
        <PermissionGate requires="governance.read_audit_log">
            <Signaux />
        </PermissionGate>
    );
}
