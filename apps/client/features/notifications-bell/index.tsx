'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Bell, Info } from 'lucide-react';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Popover, PopoverContent, PopoverTrigger } from '@lumiris/ui/components/popover';
import { useMarkNotificationsRead } from '@lumiris/api-client/react';
import { cn } from '@lumiris/ui/lib/cn';
import type { AtelierNotification } from '@/lib/notifications';
import { useDismissedNotifications, useNotificationsStore } from '@/lib/notifications-store';
import { useAuthArtisanId } from '@/lib/use-auth';

interface NotificationsBellProps {
    notifications: readonly AtelierNotification[];
}

export function NotificationsBell({ notifications }: NotificationsBellProps) {
    const artisanId = useAuthArtisanId() ?? 'unknown';
    const dismissed = useDismissedNotifications(artisanId);
    const dismissAll = useNotificationsStore((s) => s.dismissAll);
    const pruneStale = useNotificationsStore((s) => s.pruneStale);
    // Les alertes dérivées de l'état local se masquent côté client ; celles qui viennent du
    // serveur doivent être marquées lues chez lui, sinon elles reviennent au prochain chargement.
    const markRead = useMarkNotificationsRead();

    useEffect(() => {
        pruneStale(
            artisanId,
            notifications.map((n) => n.id),
        );
    }, [artisanId, notifications, pruneStale]);

    const visible = notifications.filter((n) => !dismissed.includes(n.id));
    const total = visible.length;
    const warnCount = visible.filter((n) => n.severity === 'warn').length;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                    <Bell className="h-4 w-4" />
                    {total > 0 && (
                        <Badge
                            variant={warnCount > 0 ? 'destructive' : 'secondary'}
                            className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full px-1 text-[10px] leading-none"
                        >
                            {total}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[380px] p-0">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">Notifications</p>
                    <p className="text-xs text-muted-foreground">
                        {total} active{total > 1 ? 's' : ''}
                    </p>
                </div>
                <ul className="max-h-[420px] overflow-y-auto">
                    {visible.length === 0 ? (
                        <li className="px-4 py-6 text-center text-sm text-muted-foreground">Tout est à jour.</li>
                    ) : (
                        visible.map((n) => (
                            <li key={n.id} className="border-b border-border last:border-b-0">
                                <NotificationRow notification={n} />
                            </li>
                        ))
                    )}
                </ul>
                {visible.length > 0 && (
                    <div className="border-t border-border p-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs font-normal text-muted-foreground hover:text-foreground"
                            onClick={() => {
                                dismissAll(
                                    artisanId,
                                    notifications.map((n) => n.id),
                                );
                                markRead.mutate(undefined);
                            }}
                        >
                            Tout marquer comme lu
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

function NotificationRow({ notification }: { notification: AtelierNotification }) {
    const Icon = notification.severity === 'warn' ? AlertTriangle : Info;
    const inner = (
        <div className="flex items-start gap-3 px-4 py-3">
            <span
                className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                    notification.severity === 'warn'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-muted text-muted-foreground',
                )}
            >
                <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-sm leading-tight font-medium text-foreground">{notification.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{notification.description}</p>
            </div>
        </div>
    );
    return notification.href ? (
        <Link href={notification.href} className="block transition-colors hover:bg-muted/50">
            {inner}
        </Link>
    ) : (
        inner
    );
}
