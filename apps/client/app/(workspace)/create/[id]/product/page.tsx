import { WorkspaceHeader } from '@/features/workspace-header';
import { CreateStepProduct } from '@/features/create-step-product';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
    const { id } = await params;
    return (
        <>
            <WorkspaceHeader title="Création — Le Produit" description="Étape 1 sur 4" />
            <CreateStepProduct draftId={id} />
        </>
    );
}
