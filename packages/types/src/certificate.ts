// certifs matière/artisan/produit - getEffective* déterministes, `now` toujours injecté

export type CertificationKind = 'GOTS' | 'OEKO-TEX' | 'OFG' | 'EPV' | 'GRS' | 'BLUESIGN' | 'ISO-14001' | 'CUSTOM';

export type CertificationStatus = 'Valid' | 'Expired' | 'Unverified';

export interface CertificationRef {
    id: string;
    kind: CertificationKind;
    /** Libellé libre quand `kind === 'CUSTOM'`. */
    customName?: string;
    issuer: string;
    issuedAt: string;
    expiresAt: string;
    /** Vérification humaine (founder / curator) - si false, poids effectif × 0.5. */
    verified: boolean;
    fileUrl: string;
    /** Champ libre - précise sur quoi porte la certification (e.g. "fibre laine origine Vosges"). */
    scope?: string;
}

/** Statut au temps `now` : Expired (ignorée), Unverified (×0.5), Valid (×1.0). */
export function getEffectiveStatus(cert: CertificationRef, now: Date): CertificationStatus {
    const expiresAt = new Date(cert.expiresAt);
    if (Number.isFinite(expiresAt.getTime()) && now.getTime() > expiresAt.getTime()) {
        return 'Expired';
    }
    if (!cert.verified) return 'Unverified';
    return 'Valid';
}

/** Poids effectif appliqué au scoring : 1.0 (Valid), 0.5 (Unverified), 0.0 (Expired). */
export function getEffectiveWeight(cert: CertificationRef, now: Date): number {
    switch (getEffectiveStatus(cert, now)) {
        case 'Valid':
            return 1.0;
        case 'Unverified':
            return 0.5;
        case 'Expired':
            return 0.0;
    }
}

/** Alias canonique côté spec textile artisanal - équivalent direct de {@link CertificationRef}. */
export type Certificate = CertificationRef;
