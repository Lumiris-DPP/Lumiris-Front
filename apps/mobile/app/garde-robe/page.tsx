'use client';

import { Suspense } from 'react';
import { Vault } from '@/features/vault';

export default function GardeRobePage() {
    return (
        <Suspense fallback={null}>
            <Vault />
        </Suspense>
    );
}
