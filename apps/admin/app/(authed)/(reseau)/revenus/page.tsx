import { Revenus } from '@/features/revenus';
import { PermissionGate } from '@/features/_shared/permission-gate';

export default function RevenusPage() {
    return (
        <PermissionGate requires="billing.read">
            <Revenus />
        </PermissionGate>
    );
}
