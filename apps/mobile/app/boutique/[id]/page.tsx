import { mockPassportById } from '@lumiris/mock-data';
import { PassportDetail } from '@/features/passport-detail';
import { PassportNotFound } from '@/features/passport-detail/passport-not-found';
import { isForSale } from '@/lib/marketplace';

export const dynamicParams = true;

export function generateStaticParams() {
    // Pré-rendu uniquement des pièces en vente ; les autres restent dynamiques.
    return [
        { id: 'pass-marie-001' },
        { id: 'pass-amelie-001' },
        { id: 'pass-paul-001' },
        { id: 'pass-claire-001' },
        { id: 'pass-marie-002' },
    ];
}

interface RouteProps {
    params: Promise<{ id: string }>;
}

export default async function BoutiqueDetailRoute({ params }: RouteProps) {
    const { id } = await params;
    const passport = mockPassportById(id);

    if (!passport || !isForSale(id)) {
        return <PassportNotFound passportId={id} />;
    }

    return (
        <div className="bg-background mx-auto flex h-dvh max-w-md flex-col">
            <PassportDetail passport={passport} />
        </div>
    );
}
