'use client';

import { useSearchParams } from 'next/navigation';
import { NotFound } from '@/components/not-found';
import { ArtisanView } from './artisan-view';

export default function ArtisanPage() {
    const slug = useSearchParams().get('slug');

    if (!slug) {
        return <NotFound />;
    }

    return <ArtisanView slug={slug} />;
}
