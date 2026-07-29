'use client';

import { useSearchParams } from 'next/navigation';
import { MobileScreen } from '@/components/mobile-screen';
import { NotFound } from '@/components/not-found';
import { BoutiqueDetail } from '@/features/boutique/detail';

// Fiche produit RÉELLE (catalogue public backend). L'ancienne fiche "passeport" mockée
// a été retirée : la Boutique ne présente plus que de vrais produits achetables in-app.
export default function BoutiqueProductPage() {
    const id = useSearchParams().get('id');

    if (!id) {
        return <NotFound />;
    }

    return (
        <MobileScreen>
            <BoutiqueDetail productId={id} />
        </MobileScreen>
    );
}
