import { mockRepairers, mockRepairerById } from '@lumiris/mock-data';
import { MobileScreen } from '@/components/mobile-screen';
import { NotFound } from '@/components/not-found';
import { PrefilledRepairRequest } from './prefilled-repair-request';

export function generateStaticParams() {
    return mockRepairers.map((r) => ({ slug: r.id }));
}

interface RouteProps {
    params: Promise<{ slug: string }>;
}

export default async function RepairRequestRoute({ params }: RouteProps) {
    const { slug } = await params;
    const repairer = mockRepairerById(slug);

    if (!repairer) {
        return <NotFound />;
    }

    return (
        <MobileScreen>
            <PrefilledRepairRequest repairer={repairer} />
        </MobileScreen>
    );
}
