import { WorkspaceHeader } from '@/features/workspace-header';
import { CreateStepCare } from '@/features/create-step-care';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
    const { id } = await params;
    return (
        <>
            <WorkspaceHeader title="Création — Composition & Entretien" description="Étape 2 sur 4" />
            <CreateStepCare draftId={id} />
        </>
    );
}
