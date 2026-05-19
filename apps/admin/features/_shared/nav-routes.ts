import type { ComponentType } from 'react';
import {
    BarChart3,
    Coins,
    FileText,
    Gavel,
    LayoutDashboard,
    Scissors,
    ScrollText,
    Sparkles,
    Store,
    Users,
} from 'lucide-react';
import type { AdminAction } from '@lumiris/types';

export interface NavRoute {
    readonly href: string;
    readonly label: string;
    readonly icon: ComponentType<{ className?: string }>;
    readonly requires: AdminAction;
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
                requires: 'governance.read_audit_log',
                shortcut: ['g', 'c'],
            },
            {
                href: '/conformite',
                label: 'Conformité ESPR',
                icon: ScrollText,
                requires: 'governance.read_audit_log',
            },
            {
                href: '/gouvernance',
                label: 'Gouvernance',
                icon: Gavel,
                requires: 'governance.read_audit_log',
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
                requires: 'passport.read',
                shortcut: ['g', 'p'],
            },
            {
                href: '/iris',
                label: 'Iris Workbench',
                icon: Sparkles,
                requires: 'passport.read',
                shortcut: ['g', 'i'],
            },
            {
                href: '/artisans',
                label: 'Artisans',
                icon: Store,
                requires: 'artisan.read',
                shortcut: ['g', 'a'],
            },
        ],
    },
    {
        id: 'reseau',
        label: 'Réseau & revenus',
        routes: [
            {
                href: '/retoucheurs',
                label: 'Retoucheurs',
                icon: Scissors,
                requires: 'retoucheur.read',
                shortcut: ['g', 'r'],
            },
            {
                href: '/vision-users',
                label: 'Vision Users',
                icon: Users,
                requires: 'vision_user.read',
                shortcut: ['g', 'v'],
            },
            {
                href: '/billing',
                label: 'Billing',
                icon: Coins,
                requires: 'billing.read',
                shortcut: ['g', 'b'],
            },
            {
                href: '/affiliation',
                label: 'Affiliation',
                icon: BarChart3,
                requires: 'affiliation.read',
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
