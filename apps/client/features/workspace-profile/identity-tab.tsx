'use client';

import { useCurrentArtisan } from '@/lib/current-artisan';

export function IdentityTab() {
    const artisan = useCurrentArtisan();

    return (
        <div className="max-w-sm space-y-2">
            <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">Identifiants</p>
            <dl className="text-sm">
                <div className="flex justify-between py-1">
                    <dt className="text-muted-foreground">Atelier</dt>
                    <dd className="font-medium">{artisan.atelierName}</dd>
                </div>
                <div className="flex justify-between py-1">
                    <dt className="text-muted-foreground">Artisan</dt>
                    <dd className="font-medium">{artisan.displayName}</dd>
                </div>
                <div className="flex justify-between py-1">
                    <dt className="text-muted-foreground">ID</dt>
                    <dd className="font-mono text-xs">{artisan.id}</dd>
                </div>
            </dl>
            <p className="text-muted-foreground pt-2 text-xs">
                Bio, méthode, spécialités et photos se gèrent désormais dans l&apos;onglet{' '}
                <span className="text-foreground font-medium">Vitrine publique</span>.
            </p>
        </div>
    );
}
