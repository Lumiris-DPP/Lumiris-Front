'use client';

import { useSearchParams } from 'next/navigation';
import { NotFound } from '@/components/not-found';
import { RepairerView } from './repairer-view';

export default function RepairerPage() {
    const slug = useSearchParams().get('slug');

    if (!slug) {
        return <NotFound />;
    }

    return <RepairerView slug={slug} />;
}
