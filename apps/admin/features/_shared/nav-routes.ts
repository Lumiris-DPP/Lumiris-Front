import type { ComponentType } from 'react';
import { Coins, FileText, Gavel, LayoutDashboard, Mail, ShieldCheck, Store, Users } from 'lucide-react';

export interface NavRoute {
    readonly href: string;
    readonly label: string;
    readonly icon: ComponentType<{ className?: string }>;
    readonly shortcut?: readonly [string, string];
}

export interface NavGroup {
    readonly id: 'pilotage' | 'curation' | 'reseau';
    readonly label: string;
    readonly routes: readonly NavRoute[];
}

export const NAV_GROUPS: readonly NavGroup[] = [
    {
        id: 'pilotage',
        label: 'Pilotage',
        routes: [
            {
                href: '/cockpit',
                label: 'Cockpit',
                icon: LayoutDashboard,
                shortcut: ['g', 'c'],
            },
            {
                href: '/emails',
                label: 'Emails',
                icon: Mail,
            },
        ],
    },
    {
        id: 'curation',
        label: 'Curation',
        routes: [
            {
                href: '/passeports',
                label: 'Passeports',
                icon: FileText,
                shortcut: ['g', 'p'],
            },
            {
                href: '/artisans',
                label: 'Artisans',
                icon: Store,
                shortcut: ['g', 'a'],
            },
            {
                href: '/validation',
                label: 'Validation',
                icon: ShieldCheck,
                shortcut: ['g', 'k'],
            },
        ],
    },
    {
        id: 'reseau',
        label: 'Réseau',
        routes: [
            {
                href: '/reseau',
                label: 'Réseau',
                icon: Users,
                shortcut: ['g', 'r'],
            },
            {
                href: '/revenus',
                label: 'Revenus',
                icon: Coins,
                shortcut: ['g', 'v'],
            },
            {
                href: '/litiges',
                label: 'Litiges',
                icon: Gavel,
                shortcut: ['g', 'l'],
            },
        ],
    },
];

export function findRoute(pathname: string): { group: NavGroup; route: NavRoute } | undefined {
    const exact = NAV_GROUPS.flatMap((group) => group.routes.map((route) => ({ group, route }))).find(
        (entry) => entry.route.href === pathname,
    );
    if (exact) return exact;
    return NAV_GROUPS.flatMap((group) => group.routes.map((route) => ({ group, route }))).find((entry) =>
        pathname.startsWith(`${entry.route.href}/`),
    );
}
