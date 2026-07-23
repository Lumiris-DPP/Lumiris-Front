import { useParams } from 'react-router-dom';
import { mockPassportById } from '@lumiris/mock-data';
import { PassportDetail } from '@/features/passport-detail';
import { PassportNotFound } from '@/features/passport-detail/passport-not-found';

export default function PassportRoute() {
    const { id } = useParams();
    const passport = id ? mockPassportById(id) : undefined;

    if (!passport) {
        return <PassportNotFound passportId={id ?? ''} />;
    }

    return (
        <div className="bg-background mx-auto flex h-dvh max-w-md flex-col">
            <PassportDetail passport={passport} />
        </div>
    );
}
