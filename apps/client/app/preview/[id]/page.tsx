'use client';

import { use } from 'react';
import Link from 'next/link';
import { PassportPreview } from '@/features/passport-preview';
import { usePassportSource } from '@/lib/use-passport-source';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function PassportPreviewPage({ params }: PageProps) {
    const { id } = use(params);
    const { passport, artisan, isLoading } = usePassportSource(id);

    // La résolution est entièrement côté client (session en storage) : appeler `notFound()` ici
    // ferait répondre 404 au rendu serveur sur un passeport qui s'affiche ensuite normalement.
    if (isLoading) return null;

    if (!passport || !artisan) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-8 text-center">
                <p className="text-base font-semibold text-foreground">Passeport introuvable</p>
                <p className="text-sm text-muted-foreground">
                    Ce passeport n&apos;existe plus, ou il appartient à un autre atelier.
                </p>
                <Link
                    href="/passports"
                    className="mt-2 text-sm font-semibold text-lumiris-cyan underline underline-offset-4"
                >
                    Retour à mes passeports
                </Link>
            </div>
        );
    }

    return <PassportPreview passport={passport} artisan={artisan} />;
}
