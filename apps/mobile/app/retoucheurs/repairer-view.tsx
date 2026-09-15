'use client';

import { useEffect, useState } from 'react';
import { MobileScreen } from '@/components/mobile-screen';
import { NotFound } from '@/components/not-found';
import {
    fetchPublicRepairer,
    fetchRepairerReviews,
    type PublicRepairerDto,
    type RepairerReviewDto,
} from '@/lib/public-repairer-api';
import { RepairerProfile } from '@/features/repairers/profile';

export function RepairerView({ slug }: { slug: string }) {
    const [data, setData] = useState<{ repairer: PublicRepairerDto; reviews: RepairerReviewDto[] } | null>(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setNotFound(false);
        setData(null);

        fetchPublicRepairer(slug)
            .then(async (repairer) => {
                const reviews = await fetchRepairerReviews(slug).catch(() => []);
                if (!cancelled) setData({ repairer, reviews });
            })
            .catch(() => {
                if (!cancelled) setNotFound(true);
            });

        return () => {
            cancelled = true;
        };
    }, [slug]);

    if (notFound) {
        return <NotFound />;
    }

    if (!data) {
        return <MobileScreen />;
    }

    return (
        <MobileScreen>
            <RepairerProfile repairer={data.repairer} reviews={data.reviews} />
        </MobileScreen>
    );
}
