'use client';

import { useSearchParams } from 'next/navigation';
import { NotFound } from '@/components/not-found';
import { PassportView } from './passport-view';

// Passeport public d'un DPP scanné. `?c=` porte le code public, `?k=` le jeton d'un QR d'accès
// élargi — les deux arrivent soit du scanner interne, soit d'un appareil photo natif qui ouvre
// le lien du QR directement.
export default function PublicPassportPage() {
    const searchParams = useSearchParams();
    const code = searchParams.get('c');

    if (!code) {
        return <NotFound />;
    }

    return <PassportView code={code} accessToken={searchParams.get('k')} />;
}
