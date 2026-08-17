import { notFound } from 'next/navigation';
import { mockExternalDpps, mockExternalDppByGtin } from '@lumiris/mock-data';
import { MobileScreen } from '@/components/mobile-screen';
import { ExternalDppDetail } from '@/features/external-dpp-detail';

// Export statique : seuls les GTIN listés ici existent. `dynamicParams = false` fait répondre la
// page 404 de l'app sur les autres, là où le défaut renvoyait une erreur de rendu.
export const dynamicParams = false;

export function generateStaticParams() {
    return mockExternalDpps.map((dpp) => ({ gtin: dpp.gtin }));
}

interface RouteProps {
    params: Promise<{ gtin: string }>;
}

export default async function ExternalDppRoute({ params }: RouteProps) {
    const { gtin } = await params;
    const dpp = mockExternalDppByGtin(gtin);
    if (!dpp) notFound();

    return (
        <MobileScreen>
            <ExternalDppDetail dpp={dpp} />
        </MobileScreen>
    );
}
