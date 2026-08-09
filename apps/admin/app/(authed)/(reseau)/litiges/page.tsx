import { Disputes } from '@/features/disputes';
import { PermissionGate } from '@/features/_shared/permission-gate';

export default function LitigesPage() {
    return (
        <PermissionGate requires="dispute.read">
            <Disputes />
        </PermissionGate>
    );
}
