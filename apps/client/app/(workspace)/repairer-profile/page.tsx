'use client';

import { WorkspaceHeader } from '@/features/workspace-header';
import { RepairerProfile } from '@/features/repairer-profile';

export default function RepairerProfilePage() {
    return (
        <>
            <WorkspaceHeader title="Mon profil" />
            <RepairerProfile />
        </>
    );
}
