'use client';

import { useArtisanMe } from '@lumiris/api-client/react';
import { VitrinePreview } from '@/features/vitrine-preview';

export default function VitrinePreviewPage() {
    const { data, isLoading, isError } = useArtisanMe();

    if (isLoading) {
        return (
            <div className="bg-background flex min-h-screen items-center justify-center">
                <p className="text-muted-foreground text-sm">Chargement…</p>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="bg-background flex min-h-screen items-center justify-center">
                <p className="text-muted-foreground text-sm">Profil artisan introuvable.</p>
            </div>
        );
    }

    return <VitrinePreview profile={data} />;
}
