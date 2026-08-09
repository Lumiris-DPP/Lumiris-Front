'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    BarChart3,
    BookCheck,
    FileText,
    LayoutDashboard,
    PlusCircle,
    Receipt,
    ShoppingBag,
    Store,
    Wallet,
    Wrench,
} from 'lucide-react';
import { LumirisLogo } from '@lumiris/ui/components/logo';
import { Sheet, SheetContent } from '@lumiris/ui/components/sheet';
import { toast } from '@lumiris/ui/components/sonner';
import { Switch } from '@lumiris/ui/components/switch';
import { cn } from '@lumiris/ui/lib/cn';
import { ATELIER_PASSPORT_LIMIT_LABEL, useHasAtelierPlus, usePassportCount } from './hooks';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { useBilling, useBillingStore } from '@/lib/billing-store';
import { useAuthStore } from '@/lib/auth-store';
import { useAuthRole } from '@/lib/use-auth';
import { useSubscription } from '@/lib/use-subscription';

interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    primary?: boolean;
    plusOnly?: boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
    { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/passports', label: 'Mes passeports', icon: FileText },
    { href: '/create', label: 'Création', icon: PlusCircle, primary: true },
    { href: '/invoices', label: 'Factures fournisseurs', icon: Receipt },
    { href: '/certifications', label: 'Mes certifications', icon: BookCheck },
    { href: '/shop', label: 'Boutique', icon: ShoppingBag },
    { href: '/analytics', label: 'Analytics', icon: BarChart3, plusOnly: true },
    { href: '/profile', label: 'Profil atelier', icon: Store },
    { href: '/subscription', label: 'Abonnement', icon: Wallet },
];

const REPAIRER_NAV_ITEMS: readonly NavItem[] = [
    { href: '/dashboard', label: 'Demandes', icon: LayoutDashboard },
    { href: '/repairer-profile', label: 'Mon profil', icon: Wrench },
    { href: '/subscription', label: 'Abonnement', icon: Wallet },
];

function isNavActive(pathname: string, href: string): boolean {
    return href === '/dashboard'
        ? pathname === '/' || pathname.startsWith('/dashboard')
        : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
    const Icon = item.icon;
    return (
        <li>
            <Link
                href={item.href}
                onClick={onNavigate}
                className={
                    item.primary
                        ? cn(
                              'bg-lumiris-cyan hover:bg-lumiris-cyan/90 my-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity',
                              active && 'ring-lumiris-cyan/30 ring-2 ring-offset-1',
                          )
                        : cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                              active
                                  ? 'bg-lumiris-cyan/10 text-lumiris-cyan font-medium'
                                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                          )
                }
            >
                <Icon className="h-4 w-4" />
                {item.label}
            </Link>
        </li>
    );
}

interface WorkspaceShellContextValue {
    openSidebar: () => void;
}

const WorkspaceShellContext = createContext<WorkspaceShellContextValue | null>(null);

export function useWorkspaceShell(): WorkspaceShellContextValue {
    const ctx = useContext(WorkspaceShellContext);
    if (!ctx) {
        throw new Error('useWorkspaceShell must be used inside <WorkspaceShell>');
    }
    return ctx;
}

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const ctx = useMemo<WorkspaceShellContextValue>(() => ({ openSidebar: () => setIsSidebarOpen(true) }), []);

    return (
        <WorkspaceShellContext.Provider value={ctx}>
            <div className="bg-background min-h-screen">
                <aside className="w-65 border-border bg-card fixed left-0 top-0 z-30 hidden h-screen flex-col border-r md:flex">
                    <SidebarContent />
                </aside>

                <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                    <SheetContent side="left" className="w-70 sm:max-w-70 p-0">
                        <SidebarContent onNavigate={() => setIsSidebarOpen(false)} />
                    </SheetContent>
                </Sheet>

                <main className="md:ml-65 flex min-h-screen flex-col">{children}</main>
            </div>
        </WorkspaceShellContext.Provider>
    );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname() ?? '/';
    const role = useAuthRole();
    const isRepairer = role === 'repairer';
    const artisan = useCurrentArtisan();
    const isRealMode = useAuthStore((s) => s.token != null);
    const { subscription, quota, atelierPlus } = useSubscription();
    const navItems = isRepairer ? REPAIRER_NAV_ITEMS : NAV_ITEMS;

    const demoPassportCount = usePassportCount(artisan.id);
    const demoHasPlus = useHasAtelierPlus(artisan.id);
    const billing = useBilling(artisan.id);
    const setBillingCycle = useBillingStore((s) => s.setBillingCycle);

    // Real mode: tier comes from useCurrentArtisan (live subscription), quota from GET /api/subscription.
    // ATELIER+ is now a live add-on signal (subscription.atelierPlus); demo keeps the mock billing store.
    const hasAtelierPlus = isRealMode ? atelierPlus : demoHasPlus;
    const usedCount = isRealMode ? (quota?.used ?? 0) : demoPassportCount;
    const limitLabel = isRealMode
        ? quota?.unlimited
            ? '∞'
            : quota?.limit != null
              ? String(quota.limit)
              : '—'
        : ATELIER_PASSPORT_LIMIT_LABEL[artisan.tier];

    const onToggleCycle = (annual: boolean) => {
        const next = annual ? 'annual' : 'monthly';
        setBillingCycle(artisan.id, next);
        toast.success(next === 'annual' ? 'Cycle annuel — 2 mois offerts' : 'Cycle mensuel', {
            description: next === 'annual' ? "−17% sur l'année" : 'Plus de flexibilité',
        });
    };

    return (
        <div className="flex h-full flex-col">
            <div className="border-border flex items-center gap-3 border-b px-5 py-5">
                <LumirisLogo className="h-9 w-auto" />
                <div>
                    <p className="text-foreground text-sm font-semibold leading-none">LUMIRIS</p>
                    <p className="text-muted-foreground font-mono text-[10px] tracking-widest">ATELIER</p>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="space-y-1">
                    {navItems.map((item) =>
                        item.plusOnly && !hasAtelierPlus ? null : (
                            <NavLink
                                key={item.href}
                                item={item}
                                active={isNavActive(pathname, item.href)}
                                onNavigate={onNavigate}
                            />
                        ),
                    )}
                </ul>
            </nav>

            {isRepairer ? (
                <div className="border-border space-y-1 border-t px-4 py-3">
                    <span
                        className={cn(
                            'inline-flex rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider',
                            subscription?.active
                                ? 'bg-lumiris-emerald/15 text-lumiris-emerald'
                                : 'bg-lumiris-amber/15 text-lumiris-amber',
                        )}
                    >
                        {subscription?.active ? 'LUMIRIS Local actif' : 'Sans abonnement Local'}
                    </span>
                </div>
            ) : (
                <div className="border-border space-y-2 border-t px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span
                            className={cn(
                                'rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider',
                                artisan.tier === 'Solo' && 'bg-tier-solo/15 text-tier-solo',
                                artisan.tier === 'Studio' && 'bg-tier-studio/15 text-tier-studio',
                                artisan.tier === 'Maison' && 'bg-tier-maison/15 text-tier-maison',
                            )}
                        >
                            {artisan.tier}
                        </span>
                        {hasAtelierPlus && (
                            <span className="bg-lumiris-iris/10 text-lumiris-iris rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold">
                                ATELIER+
                            </span>
                        )}
                    </div>
                    <p className="text-muted-foreground font-mono text-[11px]">
                        {usedCount} / {limitLabel} passeports actifs
                    </p>
                    {/* The cycle switch only ever wrote to a local mock billing store — a fake control
                    in real mode, where the true cycle is managed on the /subscription page. */}
                    {!isRealMode && (
                        <div className="flex items-center justify-between gap-2 pt-1">
                            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Cycle</span>
                            <div className="text-muted-foreground flex items-center gap-1.5 text-[10px]">
                                <span
                                    className={cn(billing.billingCycle === 'monthly' && 'text-foreground font-medium')}
                                >
                                    mois
                                </span>
                                <Switch
                                    checked={billing.billingCycle === 'annual'}
                                    onCheckedChange={onToggleCycle}
                                    aria-label="Basculer entre cycle mensuel et annuel"
                                    className="h-4 w-7"
                                />
                                <span
                                    className={cn(billing.billingCycle === 'annual' && 'text-foreground font-medium')}
                                >
                                    an <span className="text-lumiris-cyan font-mono">−17%</span>
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
