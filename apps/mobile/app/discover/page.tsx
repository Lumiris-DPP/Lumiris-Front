import { Discover } from '@/features/discover';
import { getDiscoverFeed } from '@/lib/discover/feed';

// Feed exécuté au build (statique) et passé en props — pas de useEffect côté client.
export default function DiscoverPage() {
    return <Discover items={getDiscoverFeed()} />;
}
