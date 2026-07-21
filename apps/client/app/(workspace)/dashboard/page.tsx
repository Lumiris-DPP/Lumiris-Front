import { WorkspaceHeader } from '@/features/workspace-header';
import { Dashboard } from '@/features/dashboard';

export default function DashboardPage() {
    return (
        <>
            <WorkspaceHeader title="Tableau de bord" />
            <Dashboard />
        </>
    );
}
