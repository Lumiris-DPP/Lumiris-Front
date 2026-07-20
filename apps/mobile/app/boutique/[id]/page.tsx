import { BoutiqueDetail } from '@/features/boutique/detail';

// Fiche produit RÉELLE (catalogue public backend). L'ancienne fiche "passeport" mockée
// a été retirée : la Boutique ne présente plus que de vrais produits achetables in-app.
export const dynamic = 'force-dynamic';

interface RouteProps {
    params: Promise<{ id: string }>;
}

export default async function BoutiqueDetailRoute({ params }: RouteProps) {
    const { id } = await params;

    return (
        <div className="bg-background mx-auto flex h-dvh max-w-md flex-col">
            <BoutiqueDetail productId={id} />
        </div>
    );
}
