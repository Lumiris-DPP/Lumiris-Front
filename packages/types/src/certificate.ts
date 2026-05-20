export type CertificationKind = 'GOTS' | 'OEKO-TEX' | 'OFG' | 'EPV' | 'GRS' | 'BLUESIGN' | 'ISO-14001' | 'CUSTOM';

export type CertificationStatus = 'Valid' | 'Expired' | 'Unverified';

export interface CertificationRef {
    id: string;
    kind: CertificationKind;
    customName?: string;
    issuer: string;
    issuedAt: string;
    expiresAt: string;
    verified: boolean;
    fileUrl: string;
    scope?: string;
}

export function getEffectiveStatus(cert: CertificationRef, now: Date): CertificationStatus {
    const expiresAt = new Date(cert.expiresAt);
    if (Number.isFinite(expiresAt.getTime()) && now.getTime() > expiresAt.getTime()) {
        return 'Expired';
    }
    if (!cert.verified) return 'Unverified';
    return 'Valid';
}

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

export type Certificate = CertificationRef;
