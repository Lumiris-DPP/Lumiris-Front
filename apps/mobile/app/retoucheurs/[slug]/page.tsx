import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { MobileScreen } from '@/components/mobile-screen';
import { fetchPublicRepairer, fetchRepairerReviews } from '@/lib/public-repairer-api';
import { RepairerProfile } from '@/features/repairers/profile';

interface RouteProps {
    params: Promise<{ slug: string }>;
}

export default async function RepairerRoute({ params }: RouteProps) {
    const { slug } = await params;

    let repairer;
    try {
        repairer = await fetchPublicRepairer(slug);
    } catch {
        notFound();
    }
    const reviews = await fetchRepairerReviews(slug).catch(() => []);

    return (
        <MobileScreen>
            <Suspense fallback={null}>
                <RepairerProfile repairer={repairer} reviews={reviews} />
            </Suspense>
        </MobileScreen>
    );
}
