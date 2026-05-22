import { Artisans } from '@/features/artisans';
import { PermissionGate } from '@/features/_shared/permission-gate';

export default function ArtisansPage() {
    return (
        <PermissionGate requires="artisan.read">
            <Artisans />
        </PermissionGate>
    );
}
