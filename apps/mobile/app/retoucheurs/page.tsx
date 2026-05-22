import { Suspense } from 'react';
import { RepairersDirectory } from '@/features/repairers';

export default function RepairersRoute() {
    return (
        <div className="bg-background mx-auto flex h-dvh max-w-md flex-col">
            <Suspense fallback={null}>
                <RepairersDirectory />
            </Suspense>
        </div>
    );
}
