'use client';

import { use, useEffect, useState } from 'react';
import { fetchPublicDppForm, type DppFormPublicDto } from '@/lib/public-dpp-api';
import { PublicPassportDetail } from '@/features/public-passport-detail';

interface PageProps {
    params: Promise<{ code: string }>;
}

export default function PublicDppPage({ params }: PageProps) {
    const { code } = use(params);
    const [data, setData] = useState<DppFormPublicDto | null>(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        fetchPublicDppForm(code)
            .then(setData)
            .catch(() => setNotFound(true));
    }, [code]);

    if (notFound) {
        return (
            <div className="bg-background flex h-dvh items-center justify-center p-8">
                <div className="space-y-1 text-center">
                    <p className="text-foreground text-sm font-semibold">DPP introuvable</p>
                    <p className="text-muted-foreground text-xs">Code : {code}</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="bg-background flex h-dvh items-center justify-center">
                <p className="text-muted-foreground font-mono text-xs">Chargement…</p>
            </div>
        );
    }

    return (
        <div className="bg-background mx-auto flex h-dvh max-w-md flex-col">
            <PublicPassportDetail dpp={data.dpp} irisScore={data.irisScore} />
        </div>
    );
}
