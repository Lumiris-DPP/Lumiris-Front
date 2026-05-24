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
    Sparkles,
    Store,
    Wallet,
} from 'lucide-react';
import { Sheet, SheetContent } from '@lumiris/ui/components/sheet';
import { toast } from '@lumiris/ui/components/sonner';
import { Switch } from '@lumiris/ui/components/switch';
import { cn } from '@lumiris/ui/lib/cn';
import { ATELIER_PASSPORT_LIMIT_LABEL, useHasAtelierPlus, usePassportCount } from './hooks';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { useBilling, useBillingStore } from '@/lib/billing-store';

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
    { href: '/analytics', label: 'Analytics', icon: BarChart3, plusOnly: true },
    { href: '/profile', label: 'Profil atelier', icon: Store },
    { href: '/subscription', label: 'Abonnement', icon: Wallet },
];

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
                <aside className="border-border bg-card w-65 fixed left-0 top-0 z-30 hidden h-screen flex-col border-r md:flex">
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
    const artisan = useCurrentArtisan();
    const passportCount = usePassportCount(artisan.id);
    const hasAtelierPlus = useHasAtelierPlus(artisan.id);
    const billing = useBilling(artisan.id);
    const setBillingCycle = useBillingStore((s) => s.setBillingCycle);

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
                <div className="bg-lumiris-cyan flex h-9 w-9 items-center justify-center rounded-lg">
                    <Sparkles className="text-primary-foreground h-4 w-4" />
                </div>
                <div>
                    <p className="text-foreground text-sm font-semibold leading-none">LUMIRIS</p>
                    <p className="text-muted-foreground font-mono text-[10px] tracking-widest">ATELIER</p>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="space-y-1">
                    {NAV_ITEMS.map((item) => {
                        if (item.plusOnly && !hasAtelierPlus) return null;
                        const isActive =
                            item.href === '/dashboard'
                                ? pathname === '/' || pathname.startsWith('/dashboard')
                                : pathname === item.href || pathname.startsWith(`${item.href}/`);
                        const Icon = item.icon;

                        if (item.primary) {
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={onNavigate}
                                        className={cn(
                                            'bg-lumiris-cyan hover:bg-lumiris-cyan/90 my-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity',
                                            isActive && 'ring-lumiris-cyan/30 ring-2 ring-offset-1',
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        }

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    onClick={onNavigate}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                                        isActive
                                            ? 'bg-lumiris-cyan/10 text-lumiris-cyan font-medium'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

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
                    {passportCount} / {ATELIER_PASSPORT_LIMIT_LABEL[artisan.tier]} passeports actifs
                </p>
                <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Cycle</span>
                    <div className="text-muted-foreground flex items-center gap-1.5 text-[10px]">
                        <span className={cn(billing.billingCycle === 'monthly' && 'text-foreground font-medium')}>
                            mois
                        </span>
                        <Switch
                            checked={billing.billingCycle === 'annual'}
                            onCheckedChange={onToggleCycle}
                            aria-label="Basculer entre cycle mensuel et annuel"
                            className="h-4 w-7"
                        />
                        <span className={cn(billing.billingCycle === 'annual' && 'text-foreground font-medium')}>
                            an <span className="text-lumiris-emerald font-mono">−17%</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
