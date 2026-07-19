import { notFound } from 'next/navigation';
import { fetchPublicArtisanProfile } from '@/lib/public-artisan-api';
import { ArtisanPublicProfile } from '@/features/artisan-profile/public-view';

interface RouteProps {
    params: Promise<{ slug: string }>;
}

export default async function ArtisanRoute({ params }: RouteProps) {
    const { slug } = await params;

    let artisan;
    try {
        artisan = await fetchPublicArtisanProfile(slug);
    } catch {
        notFound();
    }

    return (
        <div className="bg-background mx-auto flex h-dvh max-w-md flex-col">
            <ArtisanPublicProfile artisan={artisan} />
        </div>
    );
}
