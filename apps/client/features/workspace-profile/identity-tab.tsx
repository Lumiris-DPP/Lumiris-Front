'use client';

import { useCurrentArtisan } from '@/lib/current-artisan';

export function IdentityTab() {
    const artisan = useCurrentArtisan();

    return (
        <div className="max-w-sm space-y-2">
            <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">Identifiants</p>
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
            <p className="pt-2 text-xs text-muted-foreground">
                Bio, méthode, spécialités et photos se gèrent désormais dans l&apos;onglet{' '}
                <span className="font-medium text-foreground">Vitrine publique</span>.
            </p>
        </div>
    );
}
