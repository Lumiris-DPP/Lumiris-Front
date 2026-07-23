import { Suspense } from 'react';
import { mockArtisansWithSlug, mockRepairers } from '@lumiris/mock-data';
import { LocalHub } from '@/features/local-hub';

export default function LocalPage() {
    return (
        <Suspense fallback={null}>
            <LocalHub artisans={mockArtisansWithSlug} repairers={mockRepairers} />
        </Suspense>
    );
}
