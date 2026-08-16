'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, CheckCheck, LogIn } from 'lucide-react';
import type { Notification } from '@lumiris/api-client';
import { useMarkNotificationsRead, useNotifications } from '@lumiris/api-client/react';
import { useUser } from '@/lib/auth/use-user';
import { GlassCard, IridescentBackground, slideUpFade } from '@/lib/motion';

const NOTIFICATIONS_RETURN = encodeURIComponent('/me/notifications');

// Les transitions qui demandent quelque chose à l'acheteur ressortent visuellement ; les autres
// sont de l'information.
const ACTIONABLE_TYPES: ReadonlySet<Notification['type']> = new Set([
    'ORDER_DELIVERED',
    'RETURN_APPROVED',
    'RETURN_REFUSED',
    'DISPUTE_RESOLVED',
    'DISPUTE_REJECTED',
    'FAVORITE_LOW_STOCK',
]);

function formatWhen(iso?: string | null): string {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

export function Notifications() {
    const { isAuthenticated } = useUser();
    const { data: notifications = [], isLoading } = useNotifications({ enabled: isAuthenticated });
    const { mutate: markAllRead } = useMarkNotificationsRead();
    const hasUnread = notifications.some((n) => !n.read);

    // Ouvrir l'écran vaut lecture : laisser le badge allumé après consultation serait un mensonge.
    // L'appel réinvalide la liste, `hasUnread` retombe à false — pas de boucle.
    useEffect(() => {
        if (!hasUnread) return;
        markAllRead(undefined);
    }, [hasUnread, markAllRead]);

    return (
        <div className="relative flex h-full flex-col overflow-y-auto pb-28">
            <IridescentBackground intensity="subtle" />

            <motion.header
                className="px-5 pt-[max(env(safe-area-inset-top),3rem)] pb-5"
                variants={slideUpFade}
                initial="initial"
                animate="animate"
            >
                <Link
                    href="/me"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Profil
                </Link>
                <div className="mt-3 flex items-center gap-3">
                    <span
                        aria-hidden
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/60"
                    >
                        <Bell className="h-5 w-5 text-foreground" strokeWidth={1.6} />
                    </span>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Notifications</h1>
                        <p className="text-xs text-muted-foreground">Chaque étape de tes commandes.</p>
                    </div>
                </div>
            </motion.header>

            <div className="flex flex-col gap-2 px-4">
                {!isAuthenticated ? (
                    <GlassCard className="flex flex-col items-center gap-4 p-7 text-center" intensity="subtle">
                        <p className="text-sm font-semibold text-foreground">
                            Connecte-toi pour recevoir tes notifications
                        </p>
                        <Link
                            href={`/auth/sign-in?returnTo=${NOTIFICATIONS_RETURN}`}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-primary-foreground"
                        >
                            <LogIn className="h-4 w-4" />
                            Se connecter
                        </Link>
                    </GlassCard>
                ) : isLoading ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>
                ) : notifications.length === 0 ? (
                    <GlassCard className="flex flex-col items-center gap-3 p-7 text-center" intensity="subtle">
                        <CheckCheck className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.25} aria-hidden />
                        <p className="text-sm font-semibold text-foreground">Rien de neuf</p>
                        <p className="text-xs text-muted-foreground">
                            Tu seras prévenu ici dès qu&apos;une de tes commandes avance.
                        </p>
                    </GlassCard>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {notifications.map((notification) => (
                            <li key={notification.id}>
                                <NotificationRow notification={notification} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function NotificationRow({ notification }: { notification: Notification }) {
    const actionable = ACTIONABLE_TYPES.has(notification.type);
    const content = (
        <div
            className={`rounded-2xl border px-4 py-3 backdrop-blur-md transition-colors ${
                notification.read
                    ? 'border-border/60 bg-card/40'
                    : 'border-lumiris-cyan/30 bg-lumiris-cyan/5 hover:bg-lumiris-cyan/10'
            }`}
        >
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                {!notification.read ? (
                    <span
                        aria-label="Non lue"
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            actionable ? 'bg-lumiris-amber' : 'bg-lumiris-cyan'
                        }`}
                    />
                ) : null}
                {notification.title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{notification.body}</p>
            <p className="mt-1 text-[10px] text-muted-foreground/70">{formatWhen(notification.createdAt)}</p>
        </div>
    );

    return notification.href ? (
        <Link href={notification.href} className="block">
            {content}
        </Link>
    ) : (
        content
    );
}
