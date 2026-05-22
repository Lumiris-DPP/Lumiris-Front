'use client';

import { useRouter } from 'next/navigation';
import { buildGS1Identifier, type Passport } from '@lumiris/types';
import { toast } from '@lumiris/ui/components/sonner';
import { useDraftStore } from '@/lib/draft-store';

export function useDuplicatePassport(artisanId: string) {
    const router = useRouter();
    const drafts = useDraftStore((s) => s.drafts);
    const createDraft = useDraftStore((s) => s.createDraft);
    const setDraft = useDraftStore((s) => s.setDraft);

    return (source: Passport) => {
        const draftSource = drafts[source.id];
        const newId = createDraft(artisanId);
        setDraft(newId, {
            status: 'Draft',
            garment: { ...source.garment, reference: '' },
            materials: draftSource ? [...draftSource.materials] : [...source.materials],
            steps: draftSource ? [...draftSource.steps] : [...source.steps],
            certifications: draftSource ? [...draftSource.certifications] : [...source.certifications],
            warranty: { ...source.warranty },
            gs1: buildGS1Identifier('0000000000000', newId),
            lastStep: undefined,
        });
        toast.success('Passeport dupliqué', {
            description: `Brouillon créé à partir de "${source.garment.reference || source.id}".`,
        });
        router.push(`/create/${newId}/identification`);
    };
}
