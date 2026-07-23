import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPublicArtisanProfile, type ArtisanPublicProfileDto } from '@/lib/public-artisan-api';
import { ArtisanPublicProfile } from '@/features/artisan-profile/public-view';
import { NotFound } from '@/components/not-found';

export default function ArtisanRoute() {
    const { slug } = useParams();

    const [artisan, setArtisan] = useState<ArtisanPublicProfileDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        let cancelled = false;

        if (!slug) {
            setNotFound(true);
            setLoading(false);
            return;
        }

        setLoading(true);
        setNotFound(false);

        fetchPublicArtisanProfile(slug)
            .then((data) => {
                if (cancelled) return;
                setArtisan(data);
            })
            .catch(() => {
                if (cancelled) return;
                setNotFound(true);
            })
            .finally(() => {
                if (cancelled) return;
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [slug]);

    if (notFound) {
        return <NotFound />;
    }

    if (loading || !artisan) {
        return <div className="bg-background mx-auto flex h-dvh max-w-md flex-col" />;
    }

    return (
        <div className="bg-background mx-auto flex h-dvh max-w-md flex-col">
            <ArtisanPublicProfile artisan={artisan} />
        </div>
    );
}
