import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { mockRepairers, mockRepairerById } from '@lumiris/mock-data';
import { RepairerProfile } from '@/features/repairers/profile';

export const dynamicParams = false;

export function generateStaticParams() {
    return mockRepairers.map((r) => ({ slug: r.id }));
}

interface RouteProps {
    params: Promise<{ slug: string }>;
}

export default async function RepairerRoute({ params }: RouteProps) {
    const { slug } = await params;
    const repairer = mockRepairerById(slug);
    if (!repairer) notFound();
    return (
        <div className="bg-background mx-auto flex h-dvh max-w-md flex-col">
            <Suspense fallback={null}>
                <RepairerProfile repairer={repairer} />
            </Suspense>
        </div>
    );
}
