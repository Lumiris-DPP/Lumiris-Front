'use client';

import { memo, Fragment, Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CalendarClock, ChevronRight, LogOut } from 'lucide-react';
import type { AdminUserRole } from '@lumiris/types';
import { Avatar, AvatarFallback } from '@lumiris/ui/components/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@lumiris/ui/components/dropdown-menu';
import { cn } from '@lumiris/ui/lib/cn';
import { daysUntil, majorMilestones } from '@/lib/regulatory-calendar';
import { auth, useCurrentUser, useLogAction } from '@/lib/auth';
import { findRoute } from '../_shared/nav-routes';
import { CommandPalette } from '../_shared/command-palette';
import { DevUserSwitcher } from '../_shared/dev-user-switcher';

const ROLE_LABEL: Record<AdminUserRole, string> = {
    curator: 'Curateur',
    lead_curator: 'Curateur principal',
    billing_ops: 'Ops facturation',
    platform_admin: 'Admin plateforme',
    dpo: 'DPO',
};

function Breadcrumb() {
    const pathname = usePathname() ?? '';
    const searchParams = useSearchParams();
    const match = findRoute(pathname);

    if (!match) {
        return <span className="text-muted-foreground text-sm">Admin</span>;
    }

    const id = searchParams?.get('id');

    return (
        <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">{match.group.label}</span>
            <ChevronRight className="text-muted-foreground/40 h-3.5 w-3.5" aria-hidden />
            <span className="text-foreground font-medium">{match.route.label}</span>
            {id ? (
                <Fragment>
                    <ChevronRight className="text-muted-foreground/40 h-3.5 w-3.5" aria-hidden />
                    <span className="text-foreground font-mono text-xs">{id}</span>
                </Fragment>
            ) : null}
        </nav>
    );
}

function EsprCountdownChip() {
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setNow(new Date());
        const id = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(id);
    }, []);

    if (!now) {
        return (
            <div className="border-border bg-muted/40 flex items-center gap-2 rounded-lg border px-3 py-1.5">
                <CalendarClock className="text-muted-foreground h-3.5 w-3.5" aria-hidden />
                <span className="text-muted-foreground text-xs font-medium">Calendrier ESPR…</span>
            </div>
        );
    }

    const next = majorMilestones(now)[0];
    if (!next) {
        return (
            <div className="border-lumiris-amber/20 bg-lumiris-amber/5 flex items-center gap-2 rounded-lg border px-3 py-1.5">
                <CalendarClock className="text-lumiris-amber h-3.5 w-3.5" aria-hidden />
                <span className="text-lumiris-amber text-xs font-medium">Phase d&apos;application ESPR en cours</span>
            </div>
        );
    }

    const days = daysUntil(next, now);
    const overdue = days < 0;
    const tone = overdue
        ? 'border-lumiris-rose/30 bg-lumiris-rose/5 text-lumiris-rose'
        : days <= 180
          ? 'border-lumiris-rose/25 bg-lumiris-rose/5 text-lumiris-rose'
          : days <= 730
            ? 'border-lumiris-amber/25 bg-lumiris-amber/5 text-lumiris-amber'
            : 'border-lumiris-cyan/25 bg-lumiris-cyan/5 text-lumiris-cyan';

    const label = overdue
        ? `${next.title} · échéance dépassée de ${Math.abs(days)} j`
        : `J-${days.toLocaleString('fr-FR')} avant ${next.title}`;

    return (
        <a
            href="/conformite"
            aria-label={label}
            className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-opacity hover:opacity-80',
                tone,
            )}
        >
            <CalendarClock className="h-3.5 w-3.5" aria-hidden />
            <span className="text-xs font-medium tabular-nums">
                {overdue ? 'Échéance ESPR dépassée' : `J-${days.toLocaleString('fr-FR')}`}
            </span>
            <span className="text-muted-foreground hidden text-[11px] sm:inline">
                {overdue ? next.title : `avant ${next.title}`}
            </span>
        </a>
    );
}

function getInitials(fullName: string): string {
    return fullName
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function UserAvatar() {
    const user = useCurrentUser();
    const router = useRouter();
    const log = useLogAction();

    if (!user) return null;

    const handleLogout = async () => {
        log({
            action: 'auth.signout',
            targetType: 'session',
            targetId: user.id,
            payload: {},
            actor: { id: user.id, role: user.role },
        });
        await auth.signOut();
        router.replace('/login');
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label={`Compte ${user.fullName}`}
                    className="focus-visible:ring-ring rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                    <Avatar className="size-8">
                        <AvatarFallback className="text-[10px] font-semibold">
                            {getInitials(user.fullName)}
                        </AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="text-foreground text-sm font-medium">{user.fullName}</span>
                    <span className="text-muted-foreground text-xs font-normal">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">
                    {ROLE_LABEL[user.role]}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onSelect={(event) => {
                        event.preventDefault();
                        void handleLogout();
                    }}
                    className="text-lumiris-rose focus:text-lumiris-rose"
                >
                    <LogOut className="h-4 w-4" aria-hidden /> Déconnexion
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

const IS_DEV = process.env.NODE_ENV !== 'production';

function TopBarComponent() {
    return (
        <header className="border-border bg-card/80 fixed left-60 right-0 top-0 z-30 flex h-14 items-center gap-3 border-b px-6 backdrop-blur-sm">
            {/* `useSearchParams` bail-out exige une Suspense boundary à la frontière du prerender (`/_not-found`). */}
            <Suspense fallback={<span className="text-muted-foreground text-sm">Admin</span>}>
                <Breadcrumb />
            </Suspense>

            <div className="flex-1" />

            <CommandPalette />
            <EsprCountdownChip />
            {IS_DEV ? <DevUserSwitcher /> : null}
            <UserAvatar />
        </header>
    );
}

export const TopBar = memo(TopBarComponent);
