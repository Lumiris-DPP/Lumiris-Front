'use client';

import { WorkspaceHeader } from '@/features/workspace-header';
import { RepairerPassports } from '@/features/repairer-passports';

export default function RepairerPassportsPage() {
    return (
        <>
            <WorkspaceHeader title="Passeports" />
            <RepairerPassports />
        </>
    );
}
