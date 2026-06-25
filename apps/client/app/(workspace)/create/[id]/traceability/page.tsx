import { WorkspaceHeader } from '@/features/workspace-header';
import { CreateStepTraceability } from '@/features/create-step-traceability';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
    const { id } = await params;
    return (
        <>
            <WorkspaceHeader title="Création — Traçabilité Technique" description="Étape 3 sur 4" />
            <CreateStepTraceability draftId={id} />
        </>
    );
}
