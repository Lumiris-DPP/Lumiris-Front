'use client';

import { useSearchParams } from 'next/navigation';
import type { PublicRepairerDto } from '@/lib/public-repairer-api';
import { RepairRequestForm } from '@/features/repair-request';

// `?for=` pré-remplit la demande avec une pièce de la garde-robe (lien depuis un passeport).
export function PrefilledRepairRequest({ repairer }: { repairer: PublicRepairerDto }) {
    const prefillPublicCode = useSearchParams().get('for');

    return <RepairRequestForm repairer={repairer} prefillPublicCode={prefillPublicCode} />;
}
