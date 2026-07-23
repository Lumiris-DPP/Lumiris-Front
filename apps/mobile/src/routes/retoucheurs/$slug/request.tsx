import { useParams, useSearchParams } from 'react-router-dom';
import { mockRepairerById } from '@lumiris/mock-data';
import { RepairRequestForm } from '@/features/repair-request';
import { NotFound } from '@/components/not-found';

export default function RepairRequestRoute() {
    const { slug } = useParams();
    const [searchParams] = useSearchParams();
    if (!slug) return <NotFound />;
    const repairer = mockRepairerById(slug);
    if (!repairer) return <NotFound />;
    const forParam = searchParams.get('for');
    const prefillPassportId = typeof forParam === 'string' ? forParam : null;
    return (
        <div className="bg-background mx-auto flex h-dvh max-w-md flex-col">
            <RepairRequestForm repairer={repairer} prefillPassportId={prefillPassportId} />
        </div>
    );
}
