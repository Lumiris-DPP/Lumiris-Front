import { Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { mockRepairerById } from '@lumiris/mock-data';
import { RepairerProfile } from '@/features/repairers/profile';
import { NotFound } from '@/components/not-found';

export default function RepairerRoute() {
    const { slug } = useParams();
    if (!slug) return <NotFound />;
    const repairer = mockRepairerById(slug);
    if (!repairer) return <NotFound />;
    return (
        <div className="bg-background mx-auto flex h-dvh max-w-md flex-col">
            <Suspense fallback={null}>
                <RepairerProfile repairer={repairer} />
            </Suspense>
        </div>
    );
}
