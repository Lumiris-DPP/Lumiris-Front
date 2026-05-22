'use client';

import { WorkspaceHeader } from '@/features/workspace-header';
import { WorkspaceProfile } from '@/features/workspace-profile';
import { useCurrentArtisan } from '@/lib/current-artisan';

export default function ProfilePage() {
    const artisan = useCurrentArtisan();
    return (
        <>
            <WorkspaceHeader title={artisan.atelierName} />
            <WorkspaceProfile />
        </>
    );
}
