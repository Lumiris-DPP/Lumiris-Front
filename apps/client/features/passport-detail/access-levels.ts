import { Globe, Landmark, Wrench, type LucideIcon } from 'lucide-react';
import type { DppAccessLevel, DppFormDocument } from '@lumiris/api-client';

const MOBILE_URL = process.env.NEXT_PUBLIC_MOBILE_URL ?? 'http://localhost:3002';

// L'app mobile est exportée en statique : le code public et le jeton d'accès voyagent en query
// string (`/p/?c=…&k=…`), seule forme qu'un fichier HTML pré-rendu peut servir pour tout code.
export function publicPassportUrl(publicCode: string, accessToken?: string | null): string {
    const search = new URLSearchParams({ c: publicCode });
    if (accessToken) search.set('k', accessToken);
    return `${MOBILE_URL}/p/?${search.toString()}`;
}

interface AccessLevelMeta {
    label: string;
    /** Ce que voit le porteur du QR, formulé de son point de vue. */
    audience: string;
    icon: LucideIcon;
    /** Visibilités couvertes — cumulatives, comme côté backend. */
    visibilities: string[];
    /** Le niveau doit se lire d'un coup d'œil : on ne colle pas un QR « Autorités » sur une étiquette. */
    badgeClass: string;
}

export const ACCESS_LEVELS: Record<DppAccessLevel, AccessLevelMeta> = {
    PUBLIC: {
        label: 'Public',
        audience: 'Tout consommateur qui scanne le produit',
        icon: Globe,
        visibilities: ['PUBLIC_USERS'],
        badgeClass: 'bg-muted text-muted-foreground border-border',
    },
    CIRCULAR_OPERATORS: {
        label: 'Réparation',
        audience: 'Réparateurs, recycleurs, ressourceries',
        icon: Wrench,
        visibilities: ['PUBLIC_USERS', 'CIRCULAR_OPERATORS'],
        badgeClass: 'bg-lumiris-amber/10 text-lumiris-amber border-lumiris-amber/30',
    },
    AUTHORITIES: {
        label: 'Autorités',
        audience: 'Douanes, DGCCRF, surveillance du marché',
        icon: Landmark,
        visibilities: ['PUBLIC_USERS', 'CIRCULAR_OPERATORS', 'AUTHORITIES'],
        badgeClass: 'bg-lumiris-iris/10 text-lumiris-iris border-lumiris-iris/30',
    },
};

export const ACCESS_LEVEL_ORDER: DppAccessLevel[] = ['PUBLIC', 'CIRCULAR_OPERATORS', 'AUTHORITIES'];

export function documentsForLevel(documents: DppFormDocument[], level: DppAccessLevel): DppFormDocument[] {
    const scopes = ACCESS_LEVELS[level].visibilities;
    return documents.filter((d) => d.visibility && scopes.includes(d.visibility));
}
