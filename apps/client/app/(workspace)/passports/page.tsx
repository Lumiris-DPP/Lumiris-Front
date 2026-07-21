import { WorkspaceHeader } from '@/features/workspace-header';
import { PassportsList } from '@/features/passports-list';

export default function PassportsPage() {
    return (
        <>
            <WorkspaceHeader title="Passeports" />
            <PassportsList />
        </>
    );
}
