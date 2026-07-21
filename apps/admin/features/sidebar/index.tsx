'use client';

import { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LumirisLogo } from '@lumiris/ui/components/logo';
import { cn } from '@lumiris/ui/lib/cn';
import { useCurrentUser } from '@/lib/auth';
import { can } from '@/lib/auth/permissions';
import { NAV_GROUPS, type NavGroup, type NavRoute } from '../_shared/nav-routes';

function isActive(pathname: string, href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarComponent() {
    const user = useCurrentUser();
    const pathname = usePathname() ?? '';

    if (!user) return null;

    const visibleGroups: ReadonlyArray<{ group: NavGroup; routes: readonly NavRoute[] }> = NAV_GROUPS.map((group) => ({
        group,
        routes: group.routes.filter((route) => can(user.role, route.requires)),
    })).filter((entry) => entry.routes.length > 0);

    return (
        <aside className="border-border bg-sidebar fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r">
            <div className="border-border flex items-center gap-3 border-b px-5 py-6">
                <LumirisLogo className="h-8 w-auto" />
                <div>
                    <h1 className="text-foreground text-sm font-semibold tracking-wide">LUMIRIS</h1>
                </div>
            </div>

            <nav aria-label="Navigation principale" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
                {visibleGroups.map(({ group, routes }) => (
                    <div key={group.id}>
                        <p className="text-muted-foreground px-3 pb-2 text-xs uppercase tracking-wider">
                            {group.label}
                        </p>
                        <div className="space-y-0.5">
                            {routes.map((route) => {
                                const active = isActive(pathname, route.href);
                                return (
                                    <Link
                                        key={route.href}
                                        href={route.href}
                                        aria-current={active ? 'page' : undefined}
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                                            active
                                                ? 'bg-lumiris-cyan/10 text-lumiris-cyan font-medium'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                        )}
                                    >
                                        <route.icon className="h-4 w-4" />
                                        <span>{route.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>
        </aside>
    );
}

export const Sidebar = memo(SidebarComponent);
