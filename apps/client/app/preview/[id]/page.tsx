'use client';

import { notFound } from 'next/navigation';
import { use } from 'react';
import { PassportPreview } from '@/features/passport-preview';
import { usePassportSource } from '@/lib/use-passport-source';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function PassportPreviewPage({ params }: PageProps) {
    const { id } = use(params);
    const { passport, artisan } = usePassportSource(id);

    if (!passport || !artisan) {
        notFound();
    }

    return <PassportPreview passport={passport} artisan={artisan} />;
}
