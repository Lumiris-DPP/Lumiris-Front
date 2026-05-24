import type { Metadata } from 'next';
import { DiscoverCatalog } from '@/features/discover-catalog';

export const metadata: Metadata = {
    title: 'Découvrir | LUMIRIS',
    description:
        'Explorez les pièces traçées et les ateliers artisans partenaires LUMIRIS. Filtrez par score Iris, catégorie, région et certification.',
};

export default function DecouvrirPage() {
    return (
        <main className="min-h-screen pb-20 pt-28">
            <DiscoverCatalog />
        </main>
    );
}
