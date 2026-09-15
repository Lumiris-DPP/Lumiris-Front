'use client';

import { NotFound } from '@/components/not-found';
import { SearchParamsBoundary } from '@/components/search-params-boundary';
import { PassportView } from './passport-view';

// Passeport public d'un DPP scanné. `?c=` porte le code public, `?k=` le jeton d'un QR d'accès
// élargi — les deux arrivent soit du scanner interne, soit d'un appareil photo natif qui ouvre
// le lien du QR directement.
export default function PublicPassportPage() {
    return (
        <SearchParamsBoundary>
            {(searchParams) => {
                const code = searchParams.get('c');
                if (!code) return <NotFound />;

                return <PassportView code={code} accessToken={searchParams.get('k')} />;
            }}
        </SearchParamsBoundary>
    );
}
