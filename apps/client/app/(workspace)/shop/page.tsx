import { WorkspaceHeader } from '@/features/workspace-header';
import { MarketplaceProducts } from '@/features/marketplace-products';

export default function ShopPage() {
    return (
        <>
            <WorkspaceHeader
                title="Boutique"
                description="Votre catalogue produit, sa visibilité Marketplace et l’affiliation externe."
            />
            <MarketplaceProducts />
        </>
    );
}
