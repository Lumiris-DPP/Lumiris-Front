import { Suspense } from 'react';
import { mockRepairers, mockRepairerById } from '@lumiris/mock-data';
import { MobileScreen } from '@/components/mobile-screen';
import { NotFound } from '@/components/not-found';
import { RepairerProfile } from '@/features/repairers/profile';

export function generateStaticParams() {
    return mockRepairers.map((r) => ({ slug: r.id }));
}

interface RouteProps {
    params: Promise<{ slug: string }>;
}

export default async function RepairerRoute({ params }: RouteProps) {
    const { slug } = await params;
    const repairer = mockRepairerById(slug);

    if (!repairer) {
        return <NotFound />;
    }

    return (
        <MobileScreen>
            <Suspense fallback={null}>
                <RepairerProfile repairer={repairer} />
            </Suspense>
        </MobileScreen>
    );
}
