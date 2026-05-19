import { VisionUsers } from '@/features/vision-users';
import { PermissionGate } from '@/features/_shared/permission-gate';

export default function VisionUsersPage() {
    return (
        <PermissionGate requires="vision_user.read">
            <VisionUsers />
        </PermissionGate>
    );
}
