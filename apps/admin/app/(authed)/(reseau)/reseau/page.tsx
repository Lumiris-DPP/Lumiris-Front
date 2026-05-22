import { Reseau } from '@/features/reseau';
import { PermissionGate } from '@/features/_shared/permission-gate';

export default function ReseauPage() {
    return (
        <PermissionGate requires="retoucheur.read">
            <Reseau />
        </PermissionGate>
    );
}
