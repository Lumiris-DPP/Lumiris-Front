import type { Notification } from '@lumiris/api-client';
import type { Artisan, Passport } from '@lumiris/types';
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
    /** Une notification serveur déjà présente rend le message d'accueil inutile. */
    hasServerNotifications?: boolean;
}

// Notifications serveur (cycle de vie des commandes) projetées dans le format de la cloche.
// Un litige ou un retour appelle une action : ils passent en sévérité haute.
const HIGH_SEVERITY_TYPES: ReadonlySet<Notification['type']> = new Set([
    'DISPUTE_OPENED',
    'RETURN_REQUESTED',
    'ORDER_TO_SHIP',
]);

export function toAtelierNotifications(notifications: readonly Notification[]): AtelierNotification[] {
    return notifications
        .filter((n) => !n.read)
        .map((n) => ({
            id: n.id,
            severity: HIGH_SEVERITY_TYPES.has(n.type) ? ('warn' as const) : ('info' as const),
            title: n.title,
            description: n.body,
            href: n.href ?? undefined,
            date: n.createdAt ?? new Date().toISOString(),
        }));
}

const MAX_NOTIFICATIONS = 8;
const SEVERITY_RANK: Record<NotificationSeverity, number> = { warn: 0, info: 1 };

export function buildNotifications(
    { artisan, passports, hasServerNotifications = false }: BuildInput,
    now: Date = new Date(),
): readonly AtelierNotification[] {
    const out: AtelierNotification[] = [];

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

    if (out.length === 0 && !hasServerNotifications) {
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
