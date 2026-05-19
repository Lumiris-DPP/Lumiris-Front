import { Billing } from '@/features/billing';
import { PermissionGate } from '@/features/_shared/permission-gate';

export default function BillingPage() {
    return (
        <PermissionGate requires="billing.read">
            <Billing />
        </PermissionGate>
    );
}
