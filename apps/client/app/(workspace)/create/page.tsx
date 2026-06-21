'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useDraftStore } from '@/lib/draft-store';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { useAuthStore } from '@/lib/auth-store';
import { createDppForm } from '@/lib/dpp-api';

export default function CreateEntryPage() {
    const router = useRouter();
    const artisan = useCurrentArtisan();
    const token = useAuthStore((s) => s.token);
    const createDraft = useDraftStore((s) => s.createDraft);
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;

        if (token) {
            createDppForm(token)
                .then((dto) => {
                    createDraft(artisan.id, dto.id);
                    router.replace(`/create/${dto.id}/identification`);
                })
                .catch(() => {
                    // Fallback in-memory si le backend est indisponible
                    const id = createDraft(artisan.id);
                    router.replace(`/create/${id}/identification`);
                });
        } else {
            const id = createDraft(artisan.id);
            router.replace(`/create/${id}/identification`);
        }
    }, [artisan.id, createDraft, router, token]);

    return (
        <div className="text-muted-foreground flex items-center gap-2 p-12 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Création d'un nouveau brouillon…
        </div>
    );
}
