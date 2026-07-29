'use client';

import { useEffect, useState } from 'react';
import { MobileScreen } from '@/components/mobile-screen';
import { NotFound } from '@/components/not-found';
import { fetchPublicArtisanProfile, type ArtisanPublicProfileDto } from '@/lib/public-artisan-api';
import { ArtisanPublicProfile } from '@/features/artisan-profile/public-view';

export function ArtisanView({ slug }: { slug: string }) {
    const [artisan, setArtisan] = useState<ArtisanPublicProfileDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setNotFound(false);

        fetchPublicArtisanProfile(slug)
            .then((data) => {
                if (!cancelled) setArtisan(data);
            })
            .catch(() => {
                if (!cancelled) setNotFound(true);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [slug]);

    if (notFound) {
        return <NotFound />;
    }

    if (loading || !artisan) {
        return <MobileScreen />;
    }

    return (
        <MobileScreen>
            <ArtisanPublicProfile artisan={artisan} />
        </MobileScreen>
    );
}
