import type { CertificationKind } from '@lumiris/types';
import { getEffectiveStatus } from '@lumiris/types';
import type { ArtisanCertificate } from '@/lib/certificates-store';

const ONE_DAY = 24 * 60 * 60 * 1000;
export const EXPIRING_WINDOW_DAYS = 90;

export type CertStatusFilter = 'all' | 'current' | 'expiring' | 'expired';

export const CERT_STATUS_FILTER_OPTIONS: ReadonlyArray<{ label: string; value: CertStatusFilter }> = [
    { label: 'Tous statuts', value: 'all' },
    { label: 'En cours', value: 'current' },
    { label: 'Expirent bientôt', value: 'expiring' },
    { label: 'Expirés', value: 'expired' },
];

export const KIND_LABEL: Record<CertificationKind, string> = {
    GOTS: 'GOTS',
    'OEKO-TEX': 'OEKO-TEX',
    OFG: 'Origine France Garantie',
    EPV: 'Entreprise du Patrimoine Vivant',
    GRS: 'GRS',
    BLUESIGN: 'BlueSign',
    'ISO-14001': 'ISO 14001',
    CUSTOM: 'Personnalisé',
};

export function isExpiringSoon(cert: ArtisanCertificate, now: Date): boolean {
    if (getEffectiveStatus(cert, now) === 'Expired') return false;
    const remaining = (new Date(cert.expiresAt).getTime() - now.getTime()) / ONE_DAY;
    return remaining > 0 && remaining <= EXPIRING_WINDOW_DAYS;
}

export function certLabel(cert: ArtisanCertificate): string {
    if (cert.kind === 'CUSTOM') return cert.customName ?? 'Certificat personnalisé';
    return KIND_LABEL[cert.kind];
}

export function matchesStatusFilter(cert: ArtisanCertificate, filter: CertStatusFilter, now: Date): boolean {
    if (filter === 'all') return true;
    const status = getEffectiveStatus(cert, now);
    if (filter === 'expired') return status === 'Expired';
    if (filter === 'current') return status !== 'Expired';
    return isExpiringSoon(cert, now);
}
