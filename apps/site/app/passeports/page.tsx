import type { Metadata } from 'next';
import { mockPassportsPublic } from '@lumiris/mock-data';
import { PassportsDirectory } from '@/features/passports-directory';

export const metadata: Metadata = {
    title: 'Tous les passeports DPP publiés',
    description:
        'Catalogue des passeports DPP publiés sur LUMIRIS : composition, étapes de fabrication, atelier, score Iris V2. Filtrez par grade ou par catégorie de pièce.',
    alternates: { canonical: '/passeports' },
};

export default function PasseportsPage() {
    return <PassportsDirectory passports={mockPassportsPublic} />;
}
