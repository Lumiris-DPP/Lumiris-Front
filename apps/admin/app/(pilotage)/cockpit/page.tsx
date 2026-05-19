import { Cockpit } from '@/features/cockpit';
import { PermissionGate } from '@/features/_shared/permission-gate';

export default function CockpitPage() {
    return (
        <PermissionGate requires="governance.read_audit_log">
            <Cockpit />
        </PermissionGate>
    );
}
