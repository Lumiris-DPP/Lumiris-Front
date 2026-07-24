import { useParams, useSearchParams } from 'react-router-dom';
import { NotFound } from '@/components/not-found';
import { PassportView } from './passport-view';

// Public passport by scanned code. The actual code is read from the route
// params and fetched client-side (PassportView).
//
// `?k=` porte le jeton d'un QR d'accès élargi. Il arrive soit du scanner interne, soit d'un
// appareil photo natif qui ouvre le lien directement — d'où sa lecture ici et pas seulement
// dans le scanner.
export default function PublicDppPage() {
    const { code } = useParams();
    const [searchParams] = useSearchParams();
    if (!code) {
        return <NotFound />;
    }
    return <PassportView code={code} accessToken={searchParams.get('k')} />;
}
