import { WorkspaceHeader } from '@/features/workspace-header';
import { CertificateLibrary } from '@/features/certificate-library';

export default function CertificationsPage() {
    return (
        <>
            <WorkspaceHeader title="Certifications" description="Vos certificats réutilisables sur vos passeports." />
            <CertificateLibrary />
        </>
    );
}
