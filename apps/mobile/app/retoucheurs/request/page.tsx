'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MobileScreen } from '@/components/mobile-screen';
import { NotFound } from '@/components/not-found';
import { fetchPublicRepairer, type PublicRepairerDto } from '@/lib/public-repairer-api';
import { RepairRequestForm } from '@/features/repair-request';

export default function RepairRequestPage() {
    const params = useSearchParams();
    const slug = params.get('slug');
    // `?for=` pré-remplit la demande avec une pièce de la garde-robe (lien depuis un passeport).
    const prefillPublicCode = params.get('for');

    const [repairer, setRepairer] = useState<PublicRepairerDto | null>(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!slug) return;
        let cancelled = false;
        setNotFound(false);
        setRepairer(null);

        fetchPublicRepairer(slug)
            .then((data) => {
                if (!cancelled) setRepairer(data);
            })
            .catch(() => {
                if (!cancelled) setNotFound(true);
            });

        return () => {
            cancelled = true;
        };
    }, [slug]);

    if (!slug || notFound) {
        return <NotFound />;
    }

    if (!repairer) {
        return <MobileScreen />;
    }

    return (
        <MobileScreen>
            <RepairRequestForm repairer={repairer} prefillPublicCode={prefillPublicCode} />
        </MobileScreen>
    );
}
