'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, Archive, MapPin, ShoppingBag, User } from 'lucide-react';
import { fadeInOut, SPRING_INDICATOR, SPRING_TAB } from '@/lib/motion';
import { migrateLegacyKeys } from '@/lib/migrate-legacy-keys';
import { useCartCount } from '@/lib/marketplace';
import { OfflineBanner } from './offline-banner';

type Tab = 'scan' | 'boutique' | 'garde-robe' | 'local' | 'me';

interface TabConfig {
    id: Tab;
    href: string;
    label: string;
    Icon: typeof Scan;
}

const TABS: readonly TabConfig[] = [
    { id: 'scan', href: '/', label: 'Scan', Icon: Scan },
    { id: 'boutique', href: '/boutique', label: 'Boutique', Icon: ShoppingBag },
    { id: 'garde-robe', href: '/garde-robe', label: 'Garde-Robe', Icon: Archive },
    { id: 'local', href: '/local', label: 'Local', Icon: MapPin },
    { id: 'me', href: '/me', label: 'Moi', Icon: User },
];

function activeTabFor(pathname: string): Tab | null {
    if (pathname === '/') return 'scan';
    if (
        pathname === '/boutique' ||
        pathname.startsWith('/boutique/') ||
        pathname === '/panier' ||
        pathname === '/checkout' ||
        pathname.startsWith('/commande/')
    ) {
        return 'boutique';
    }
    if (
        pathname === '/garde-robe' ||
        pathname.startsWith('/garde-robe/') ||
        pathname === '/vault' ||
        pathname.startsWith('/vault/')
    ) {
        return 'garde-robe';
    }
    if (
        pathname === '/local' ||
        pathname.startsWith('/local/') ||
        pathname.startsWith('/artisans/') ||
        pathname.startsWith('/retoucheurs')
    ) {
        return 'local';
    }
    if (pathname === '/me' || pathname.startsWith('/me/') || pathname === '/about' || pathname === '/help') {
        return 'me';
    }
    return null;
}

function shouldHideTabBar(pathname: string): boolean {
    if (pathname === '/auth' || pathname.startsWith('/auth/')) return true;
    if (pathname === '/onboarding' || pathname.startsWith('/onboarding/')) return true;
    if (pathname.startsWith('/passeport/')) return true;
    if (pathname.startsWith('/boutique/')) return true;
    if (pathname === '/panier' || pathname === '/checkout' || pathname.startsWith('/commande/')) return true;
    return false;
}

interface AppShellProps {
    children: ReactNode;
    hideTabBar?: boolean;
}

export function AppShell({ children, hideTabBar = false }: AppShellProps) {
    const pathname = usePathname() ?? '/';
    const activeTab = activeTabFor(pathname);
    const tabBarHidden = hideTabBar || shouldHideTabBar(pathname);
    const cartCount = useCartCount();

    useEffect(() => {
        migrateLegacyKeys();
    }, []);

    return (
        <div className="bg-background relative mx-auto flex h-dvh max-w-md flex-col overflow-hidden">
            <OfflineBanner />
            <div className="relative flex-1 overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={pathname}
                        className="absolute inset-0"
                        variants={fadeInOut}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {tabBarHidden ? null : (
                    <motion.nav
                        key="tab-bar"
                        aria-label="Navigation principale"
                        className="border-border/40 bg-background/85 absolute inset-x-0 bottom-0 z-50 border-t px-4 pb-[max(env(safe-area-inset-bottom),1.75rem)] pt-2 backdrop-blur-xl"
                        initial={{ y: 80 }}
                        animate={{ y: 0 }}
                        exit={{ y: 80 }}
                        transition={SPRING_TAB}
                    >
                        <div className="flex items-center justify-around">
                            {TABS.map(({ id, href, label, Icon }) => {
                                const active = activeTab === id;
                                return (
                                    <Link
                                        key={id}
                                        href={href}
                                        prefetch
                                        aria-current={active ? 'page' : undefined}
                                        className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 transition-colors ${
                                            active ? 'text-lumiris-cyan' : 'text-muted-foreground'
                                        }`}
                                    >
                                        <span className="relative">
                                            <Icon className="h-5 w-5" />
                                            {id === 'boutique' && cartCount > 0 ? (
                                                <span
                                                    aria-label={`${cartCount} article${cartCount > 1 ? 's' : ''} dans le panier`}
                                                    className="bg-lumiris-cyan text-background absolute -right-2 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold tabular-nums"
                                                >
                                                    {cartCount > 9 ? '9+' : cartCount}
                                                </span>
                                            ) : null}
                                        </span>
                                        <span className="text-[10px] font-semibold tracking-tight">{label}</span>
                                        {active ? (
                                            <motion.span
                                                className="bg-lumiris-cyan absolute -top-2 h-0.5 w-8 rounded-full"
                                                layoutId="tab-indicator"
                                                transition={SPRING_INDICATOR}
                                            />
                                        ) : null}
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.nav>
                )}
            </AnimatePresence>
        </div>
    );
}
