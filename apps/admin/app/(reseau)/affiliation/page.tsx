import { Affiliation } from '@/features/affiliation';
import { PermissionGate } from '@/features/_shared/permission-gate';

export default function AffiliationPage() {
    return (
        <PermissionGate requires="affiliation.read">
            <Affiliation />
        </PermissionGate>
    );
}
