'use client';

import { useSearchParams } from 'next/navigation';
import type { Repairer } from '@lumiris/types';
import { RepairRequestForm } from '@/features/repair-request';

// `?for=` pré-remplit la demande avec une pièce de la garde-robe (lien depuis un passeport).
export function PrefilledRepairRequest({ repairer }: { repairer: Repairer }) {
    const prefillPassportId = useSearchParams().get('for');

    return <RepairRequestForm repairer={repairer} prefillPassportId={prefillPassportId} />;
}
