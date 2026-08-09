import { notFound } from 'next/navigation';
import { MobileScreen } from '@/components/mobile-screen';
import { fetchPublicRepairer } from '@/lib/public-repairer-api';
import { PrefilledRepairRequest } from './prefilled-repair-request';

interface RouteProps {
    params: Promise<{ slug: string }>;
}

export default async function RepairRequestRoute({ params }: RouteProps) {
    const { slug } = await params;

    let repairer;
    try {
        repairer = await fetchPublicRepairer(slug);
    } catch {
        notFound();
    }

    return (
        <MobileScreen>
            <PrefilledRepairRequest repairer={repairer} />
        </MobileScreen>
    );
}
