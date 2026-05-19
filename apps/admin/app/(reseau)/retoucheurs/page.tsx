import { Retoucheurs } from '@/features/retoucheurs';
import { PermissionGate } from '@/features/_shared/permission-gate';

export default function RetoucheursPage() {
    return (
        <PermissionGate requires="retoucheur.read">
            <Retoucheurs />
        </PermissionGate>
    );
}
