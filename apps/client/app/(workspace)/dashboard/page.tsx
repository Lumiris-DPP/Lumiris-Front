'use client';

import { WorkspaceHeader } from '@/features/workspace-header';
import { Dashboard } from '@/features/dashboard';
import { RepairerDashboard } from '@/features/repairer-dashboard';
import { useAuthRole } from '@/lib/use-auth';

export default function DashboardPage() {
    const role = useAuthRole();
    const isRepairer = role === 'repairer';

    return (
        <>
            <WorkspaceHeader title="Tableau de bord" />
            {isRepairer ? <RepairerDashboard /> : <Dashboard />}
        </>
    );
}
