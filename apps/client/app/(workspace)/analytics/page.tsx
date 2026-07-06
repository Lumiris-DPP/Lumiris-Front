'use client';

import { Analytics } from '@/features/analytics';
import { WorkspaceHeader } from '@/features/workspace-header';

export default function AnalyticsPage() {
    return (
        <>
            <WorkspaceHeader title="Statistiques" description="Scans, top passeports, performance." />
            <Analytics />
        </>
    );
}
