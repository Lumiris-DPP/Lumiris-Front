import { useParams } from 'react-router-dom';
import { mockExternalDppByGtin } from '@lumiris/mock-data';
import { ExternalDppDetail } from '@/features/external-dpp-detail';
import { ExternalDppNotFound } from '@/features/external-dpp-detail/external-dpp-not-found';

export default function ExternalDppRoute() {
    const { gtin } = useParams();
    const dpp = gtin ? mockExternalDppByGtin(gtin) : undefined;

    if (!dpp) {
        return <ExternalDppNotFound gtin={gtin ?? ''} />;
    }

    return (
        <div className="bg-background mx-auto flex h-dvh max-w-md flex-col">
            <ExternalDppDetail dpp={dpp} />
        </div>
    );
}
