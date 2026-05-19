import { IrisWorkbench } from '@/features/iris-workbench';
import { PermissionGate } from '@/features/_shared/permission-gate';

export default function IrisPage() {
    return (
        <PermissionGate requires="passport.read">
            <IrisWorkbench />
        </PermissionGate>
    );
}
