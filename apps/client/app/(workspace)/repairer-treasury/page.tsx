'use client';

import { WorkspaceHeader } from '@/features/workspace-header';
import { RepairerTreasury } from '@/features/repairer-treasury';

export default function RepairerTreasuryPage() {
    return (
        <>
            <WorkspaceHeader title="Trésorerie" description="Quand chaque intervention vous est versée, et pourquoi." />
            <RepairerTreasury />
        </>
    );
}
