import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ReclamerClient } from './reclamer-client';

export const metadata: Metadata = {
    title: 'Réclamer ma fiche — LUMIRIS Atelier',
    robots: { index: false },
};

export default function ReclamerPage() {
    return (
        <Suspense fallback={null}>
            <ReclamerClient />
        </Suspense>
    );
}
