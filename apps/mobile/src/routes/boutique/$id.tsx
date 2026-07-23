import { useParams } from 'react-router-dom';
import { BoutiqueDetail } from '@/features/boutique/detail';
import { NotFound } from '@/components/not-found';

// Fiche produit RÉELLE (catalogue public backend). L'ancienne fiche "passeport" mockée
// a été retirée : la Boutique ne présente plus que de vrais produits achetables in-app.

export default function BoutiqueDetailRoute() {
    const { id } = useParams();

    if (!id) {
        return <NotFound />;
    }

    return (
        <div className="bg-background mx-auto flex h-dvh max-w-md flex-col">
            <BoutiqueDetail productId={id} />
        </div>
    );
}
