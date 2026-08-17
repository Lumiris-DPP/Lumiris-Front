import { notFound } from 'next/navigation';
import { mockPassports, mockPassportById } from '@lumiris/mock-data';
import { MobileScreen } from '@/components/mobile-screen';
import { PassportDetail } from '@/features/passport-detail';

export const dynamicParams = false;

export function generateStaticParams() {
    return mockPassports.map((p) => ({ id: p.id }));
}

interface RouteProps {
    params: Promise<{ id: string }>;
}

export default async function PassportRoute({ params }: RouteProps) {
    const { id } = await params;
    const passport = mockPassportById(id);
    if (!passport) notFound();
    return (
        <MobileScreen>
            <PassportDetail passport={passport} />
        </MobileScreen>
    );
}
