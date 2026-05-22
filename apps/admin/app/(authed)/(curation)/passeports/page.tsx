import { Passports } from '@/features/passports';
import { PermissionGate } from '@/features/_shared/permission-gate';

export default function PasseportsPage() {
    return (
        <PermissionGate requires="passport.read">
            <Passports />
        </PermissionGate>
    );
}
