'use client';

import { memo, Fragment, Suspense, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Bell, CalendarClock, ChevronRight } from 'lucide-react';
import { daysUntil, majorMilestones } from '@/lib/regulatory-calendar';
import { findRoute } from '../_shared/nav-routes';
import { CommandPalette } from '../_shared/command-palette';
import { DevUserSwitcher } from '../_shared/dev-user-switcher';

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
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-opacity hover:opacity-80 ${tone}`}
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

function TopBarComponent() {
    return (
        <header className="border-border bg-card/80 fixed left-60 right-0 top-0 z-30 flex h-14 items-center justify-between border-b px-6 backdrop-blur-sm">
            <div className="flex items-center gap-4">
                <CommandPalette />
                {/* `useSearchParams` bail-out exige une Suspense boundary à la frontière du prerender (`/_not-found`). */}
                <Suspense fallback={<span className="text-muted-foreground text-sm">Admin</span>}>
                    <Breadcrumb />
                </Suspense>
            </div>

            <div className="flex items-center gap-3">
                <DevUserSwitcher />

                <button
                    type="button"
                    aria-label="Notifications"
                    className="text-muted-foreground hover:bg-muted hover:text-foreground relative rounded-lg p-2 transition-colors"
                >
                    <Bell className="h-4 w-4" aria-hidden />
                    <span className="bg-lumiris-rose absolute right-1.5 top-1.5 h-2 w-2 rounded-full" />
                </button>

                <EsprCountdownChip />
            </div>
        </header>
    );
}

export const TopBar = memo(TopBarComponent);
