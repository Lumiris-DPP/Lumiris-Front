import { mockPassports, mockPassportById } from '@lumiris/mock-data';
import { MobileScreen } from '@/components/mobile-screen';
import { PassportDetail } from '@/features/passport-detail';
import { PassportNotFound } from '@/features/passport-detail/passport-not-found';

export function generateStaticParams() {
    return mockPassports.map((p) => ({ id: p.id }));
}

interface RouteProps {
    params: Promise<{ id: string }>;
}

export default async function PassportRoute({ params }: RouteProps) {
    const { id } = await params;
    const passport = mockPassportById(id);

    if (!passport) {
        return <PassportNotFound passportId={id} />;
    }

    return (
        <MobileScreen>
            <PassportDetail passport={passport} />
        </MobileScreen>
    );
}
