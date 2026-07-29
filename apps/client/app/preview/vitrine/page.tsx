'use client';

import { useArtisanMe } from '@lumiris/api-client/react';
import { VitrinePreview } from '@/features/vitrine-preview';

export default function VitrinePreviewPage() {
    const { data, isLoading, isError } = useArtisanMe();

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <p className="text-sm text-muted-foreground">Chargement…</p>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <p className="text-sm text-muted-foreground">Profil artisan introuvable.</p>
            </div>
        );
    }

    return <VitrinePreview profile={data} />;
}
