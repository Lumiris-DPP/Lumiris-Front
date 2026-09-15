'use client';

import { NotFound } from '@/components/not-found';
import { SearchParamsBoundary } from '@/components/search-params-boundary';
import { ArtisanView } from './artisan-view';

export default function ArtisanPage() {
    return (
        <SearchParamsBoundary>
            {(searchParams) => {
                const slug = searchParams.get('slug');
                return slug ? <ArtisanView slug={slug} /> : <NotFound />;
            }}
        </SearchParamsBoundary>
    );
}
