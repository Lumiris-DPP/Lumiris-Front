import { Suspense } from 'react';
import { LocalHub } from '@/features/local-hub';

export default function LocalPage() {
    return (
        <Suspense fallback={null}>
            <LocalHub />
        </Suspense>
    );
}
