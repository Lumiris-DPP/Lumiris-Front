'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    BarChart3,
    BookCheck,
    CalendarClock,
    FileText,
    LayoutDashboard,
    Lock,
    PlusCircle,
    Receipt,
    ShoppingBag,
    Store,
    Truck,
    Wallet,
} from 'lucide-react';
import { LumirisLogo } from '@lumiris/ui/components/logo';
import { Sheet, SheetContent } from '@lumiris/ui/components/sheet';
import { toast } from '@lumiris/ui/components/sonner';
import { Switch } from '@lumiris/ui/components/switch';
import { cn } from '@lumiris/ui/lib/cn';
import { ATELIER_PASSPORT_LIMIT_LABEL, useHasAtelierPlus, usePassportCount, usePendingOrderCount } from './hooks';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { useBilling, useBillingStore } from '@/lib/billing-store';
import { useAuthStore } from '@/lib/auth-store';
import { useSubscription } from '@/lib/use-subscription';
import { useSubscriptionGate } from '@/lib/use-subscription-gate';

interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    primary?: boolean;
    /** Affiche le nombre de commandes en attente d'action sur cette entrée. */
    showPendingOrders?: boolean;
    requiresSubscription?: boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
    { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/passports', label: 'Mes passeports', icon: FileText },
    { href: '/create', label: 'Création', icon: PlusCircle, primary: true, requiresSubscription: true },
    { href: '/invoices', label: 'Factures fournisseurs', icon: Receipt },
    { href: '/certifications', label: 'Mes certifications', icon: BookCheck },
    { href: '/shop', label: 'Boutique', icon: ShoppingBag },
    { href: '/commandes', label: 'Commandes', icon: Truck, showPendingOrders: true },
    { href: '/tresorerie', label: 'Trésorerie', icon: CalendarClock },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/profile', label: 'Profil atelier', icon: Store },
    { href: '/subscription', label: 'Abonnement', icon: Wallet },
];

function isNavActive(pathname: string, href: string): boolean {
    return href === '/dashboard'
        ? pathname === '/' || pathname.startsWith('/dashboard')
        : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
    item,
    active,
    badge = 0,
    onNavigate,
}: {
    item: NavItem;
    active: boolean;
    badge?: number;
    onNavigate?: () => void;
}) {
    const Icon = item.icon;
    const { blocked, notifyBlocked } = useSubscriptionGate();
    // Sans abonnement actif, l'entrée reste cliquable mais n'ouvre rien : elle explique le refus.
    const locked = Boolean(item.requiresSubscription) && blocked;

    const className = item.primary
        ? cn(
              'my-2 flex w-full items-center gap-3 rounded-lg bg-lumiris-cyan px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:bg-lumiris-cyan/90',
              active && 'ring-2 ring-lumiris-cyan/30 ring-offset-1',
          )
        : cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              active
                  ? 'bg-lumiris-cyan/10 font-medium text-lumiris-cyan'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          );

    const content = (
        <>
            {locked ? <Lock className="h-4 w-4" aria-hidden /> : <Icon className="h-4 w-4" />}
            <span className="flex-1 text-left">{item.label}</span>
            {badge > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-lumiris-cyan px-1.5 text-[10px] font-bold text-white tabular-nums">
                    {badge > 99 ? '99+' : badge}
                </span>
            )}
        </>
    );

    return (
        <li>
            {locked ? (
                <button type="button" onClick={notifyBlocked} className={className}>
                    {content}
                </button>
            ) : (
                <Link href={item.href} onClick={onNavigate} className={className}>
                    {content}
                </Link>
            )}
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
    const artisan = useCurrentArtisan();
    const isRealMode = useAuthStore((s) => s.token != null);
    const { quota, atelierPlus } = useSubscription();

    // Charge de travail en attente : le vendeur doit voir depuis n'importe quel écran qu'un colis
    // ou un litige l'attend, sans avoir à ouvrir l'onglet.
    const pendingOrders = usePendingOrderCount();
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
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.href}
                            item={item}
                            active={isNavActive(pathname, item.href)}
                            badge={item.showPendingOrders ? pendingOrders : 0}
                            onNavigate={onNavigate}
                        />
                    ))}
                </ul>
            </nav>

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
                            <span className={cn(billing.billingCycle === 'monthly' && 'font-medium text-foreground')}>
                                mois
                            </span>
                            <Switch
                                checked={billing.billingCycle === 'annual'}
                                onCheckedChange={onToggleCycle}
                                aria-label="Basculer entre cycle mensuel et annuel"
                                className="h-4 w-7"
                            />
                            <span className={cn(billing.billingCycle === 'annual' && 'font-medium text-foreground')}>
                                an <span className="font-mono text-lumiris-cyan">−17%</span>
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
