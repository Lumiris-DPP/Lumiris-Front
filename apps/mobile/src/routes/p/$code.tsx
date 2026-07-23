import { useParams } from 'react-router-dom';
import { NotFound } from '@/components/not-found';
import { PassportView } from './passport-view';

// Public passport by scanned code. The actual code is read from the route
// params and fetched client-side (PassportView).
export default function PublicDppPage() {
    const { code } = useParams();
    if (!code) {
        return <NotFound />;
    }
    return <PassportView code={code} />;
}
