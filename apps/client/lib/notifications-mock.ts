import type { Artisan, CertificationRef, Passport } from '@lumiris/types';
import { INCOMPLETION_FULL_LABEL, PASSPORT_STATUS_DESCRIPTION } from './passport-status';

export type NotificationSeverity = 'info' | 'warn';

export interface AtelierNotification {
    id: string;
    severity: NotificationSeverity;
    title: string;
    description: string;
    href?: string;
    date: string;
}

interface BuildInput {
    artisan: Artisan;
    passports: readonly Passport[];
    certificates: readonly CertificationRef[];
}

interface AtelierCertsStore {
    state?: { byArtisan?: Record<string, readonly CertificationRef[]> };
}

const MAX_NOTIFICATIONS = 8;
const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const SEVERITY_RANK: Record<NotificationSeverity, number> = { warn: 0, info: 1 };

function readLocalCerts(artisanId: string): readonly CertificationRef[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem('atelier-certs');
        if (!raw) return [];
        const parsed = JSON.parse(raw) as AtelierCertsStore;
        return parsed?.state?.byArtisan?.[artisanId] ?? [];
    } catch {
        return [];
    }
}

export function buildNotifications(
    { artisan, passports, certificates }: BuildInput,
    now: Date = new Date(),
): readonly AtelierNotification[] {
    const out: AtelierNotification[] = [];

    const merged = [...certificates, ...readLocalCerts(artisan.id)];
    const seen = new Set<string>();
    for (const cert of merged) {
        if (seen.has(cert.id)) continue;
        seen.add(cert.id);
        const expiresAt = new Date(cert.expiresAt);
        if (!Number.isFinite(expiresAt.getTime())) continue;
        const delta = expiresAt.getTime() - now.getTime();
        if (delta <= 0 || delta > SIXTY_DAYS_MS) continue;
        const days = Math.max(1, Math.round(delta / ONE_DAY_MS));
        const label = cert.kind === 'CUSTOM' ? (cert.customName ?? 'Certification') : cert.kind;
        out.push({
            id: `cert-expiry-${cert.id}`,
            severity: 'warn',
            title: `${label} expire bientôt`,
            description: `${cert.issuer} — ${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}.`,
            href: '/certifications',
            date: cert.expiresAt,
        });
    }

    for (const passport of passports) {
        if (passport.status !== 'InCompletion') continue;
        out.push({
            id: `passport-incomplete-${passport.id}`,
            severity: 'info',
            title: INCOMPLETION_FULL_LABEL,
            description: `Réf. ${passport.garment.reference} — ${PASSPORT_STATUS_DESCRIPTION.InCompletion}.`,
            href: `/passports/${passport.id}`,
            date: passport.updatedAt,
        });
    }

    if (out.length === 0) {
        out.push({
            id: 'welcome',
            severity: 'info',
            title: 'Bienvenue dans la démo ATELIER',
            description: `${artisan.displayName}, aucune alerte en cours. Créez un passeport pour commencer.`,
            date: now.toISOString(),
        });
    }

    out.sort((a, b) => {
        const sev = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
        if (sev !== 0) return sev;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return out.slice(0, MAX_NOTIFICATIONS);
}
