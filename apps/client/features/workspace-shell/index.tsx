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
                              'my-2 flex items-center gap-3 rounded-lg bg-lumiris-cyan px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:bg-lumiris-cyan/90',
                              active && 'ring-2 ring-lumiris-cyan/30 ring-offset-1',
                          )
                        : cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                              active
                                  ? 'bg-lumiris-cyan/10 font-medium text-lumiris-cyan'
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
            <div className="min-h-screen bg-background">
                <aside className="fixed top-0 left-0 z-30 hidden h-screen w-65 flex-col border-r border-border bg-card md:flex">
                    <SidebarContent />
                </aside>

                <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                    <SheetContent side="left" className="w-70 p-0 sm:max-w-70">
                        <SidebarContent onNavigate={() => setIsSidebarOpen(false)} />
                    </SheetContent>
                </Sheet>

                <main className="flex min-h-screen flex-col md:ml-65">{children}</main>
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
            <div className="flex items-center gap-3 border-b border-border px-5 py-5">
                <LumirisLogo className="h-9 w-auto" />
                <div>
                    <p className="text-sm leading-none font-semibold text-foreground">LUMIRIS</p>
                    <p className="font-mono text-[10px] tracking-widest text-muted-foreground">ATELIER</p>
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
                <div className="space-y-1 border-t border-border px-4 py-3">
                    <span
                        className={cn(
                            'inline-flex rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider uppercase',
                            subscription?.active
                                ? 'bg-lumiris-emerald/15 text-lumiris-emerald'
                                : 'bg-lumiris-amber/15 text-lumiris-amber',
                        )}
                    >
                        {subscription?.active ? 'LUMIRIS Local actif' : 'Sans abonnement Local'}
                    </span>
                </div>
            ) : (
                <div className="space-y-2 border-t border-border px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span
                            className={cn(
                                'rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider uppercase',
                                artisan.tier === 'Solo' && 'bg-tier-solo/15 text-tier-solo',
                                artisan.tier === 'Studio' && 'bg-tier-studio/15 text-tier-studio',
                                artisan.tier === 'Maison' && 'bg-tier-maison/15 text-tier-maison',
                            )}
                        >
                            {artisan.tier}
                        </span>
                        {hasAtelierPlus && (
                            <span className="rounded-md bg-lumiris-iris/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-lumiris-iris">
                                ATELIER+
                            </span>
                        )}
                    </div>
                    <p className="font-mono text-[11px] text-muted-foreground">
                        {usedCount} / {limitLabel} passeports actifs
                    </p>
                    {/* The cycle switch only ever wrote to a local mock billing store — a fake control
                    in real mode, where the true cycle is managed on the /subscription page. */}
                    {!isRealMode && (
                        <div className="flex items-center justify-between gap-2 pt-1">
                            <span className="text-[10px] tracking-wider text-muted-foreground uppercase">Cycle</span>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <span
                                    className={cn(billing.billingCycle === 'monthly' && 'font-medium text-foreground')}
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
                                    className={cn(billing.billingCycle === 'annual' && 'font-medium text-foreground')}
                                >
                                    an <span className="font-mono text-lumiris-cyan">−17%</span>
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
