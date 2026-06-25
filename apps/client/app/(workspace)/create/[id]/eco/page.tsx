import { WorkspaceHeader } from '@/features/workspace-header';
import { CreateStepEco } from '@/features/create-step-eco';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
    const { id } = await params;
    return (
        <>
            <WorkspaceHeader title="Création — Éco-Score & Publication" description="Étape 4 sur 4" />
            <CreateStepEco draftId={id} />
        </>
    );
}
