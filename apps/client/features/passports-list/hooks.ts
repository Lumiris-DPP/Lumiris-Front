'use client';

import { useRouter } from 'next/navigation';
import type { Passport } from '@lumiris/types';
import { toast } from '@lumiris/ui/components/sonner';
import { useDraftStore } from '@/lib/draft-store';

export function useDuplicatePassport(artisanId: string) {
    const router = useRouter();
    const createDraft = useDraftStore((s) => s.createDraft);
    const { setGarment, setMaterials } = useDraftStore.getState();

    return (source: Passport) => {
        const newId = createDraft(artisanId);
        setGarment(newId, { ...source.garment, reference: '' });
        setMaterials(newId, source.materials.map((m) => ({
            fiber: m.fiber,
            percentage: m.percentage,
            originCountry: m.originCountry,
        })));
        toast.success('Passeport dupliqué', {
            description: `Brouillon créé à partir de "${source.garment.reference || source.id}".`,
        });
        router.push(`/create/${newId}/product`);
    };
}
