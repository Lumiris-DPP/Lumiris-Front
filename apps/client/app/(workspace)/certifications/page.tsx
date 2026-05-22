import { WorkspaceHeader } from '@/features/workspace-header';
import { CertificationsList } from '@/features/certifications-list';

export default function CertificationsPage() {
    return (
        <>
            <WorkspaceHeader title="Certifications" description="Vos labels et échéances." />
            <CertificationsList />
        </>
    );
}
