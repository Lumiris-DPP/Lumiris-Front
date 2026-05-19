'use client';

import { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

    const visibleGroups: ReadonlyArray<{ group: NavGroup; routes: readonly NavRoute[] }> = NAV_GROUPS.map((group) => ({
        group,
        routes: group.routes.filter((route) => can(user.role, route.requires)),
    })).filter((entry) => entry.routes.length > 0);

    return (
        <aside className="border-border bg-card fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r">
            <div className="flex items-center gap-3 px-5 py-6">
                <div className="bg-lumiris-emerald flex h-8 w-8 items-center justify-center rounded-lg">
                    <div className="bg-primary-foreground h-3 w-3 rounded-sm" />
                </div>
                <div>
                    <h1 className="text-foreground text-sm font-semibold tracking-wide">LUMIRIS</h1>
                    <p className="text-muted-foreground font-mono text-[10px] tracking-widest">Console ATELIER</p>
                </div>
            </div>

            <nav aria-label="Navigation principale" className="flex-1 overflow-y-auto px-3 py-2">
                {visibleGroups.map(({ group, routes }) => (
                    <div key={group.id} className="mb-4">
                        <p className="text-muted-foreground/70 px-3 pb-1.5 font-mono text-[10px] uppercase tracking-widest">
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
                                            'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
                                            active
                                                ? 'bg-lumiris-emerald/8 text-lumiris-emerald font-medium'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                        )}
                                    >
                                        {active && (
                                            <span className="bg-lumiris-emerald w-0.75 absolute left-0 top-1/2 h-6 -translate-y-1/2 rounded-r-full" />
                                        )}
                                        <route.icon
                                            className={cn(
                                                'h-4.5 w-4.5',
                                                active ? 'text-lumiris-emerald' : 'text-muted-foreground',
                                            )}
                                        />
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
