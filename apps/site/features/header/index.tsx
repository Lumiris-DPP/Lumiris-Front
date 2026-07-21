'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LumirisLogo } from '@lumiris/ui/components/logo';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@lumiris/ui/components/sheet';

const navLinks = [
    { label: 'Accueil', href: '/' },
    { label: 'Découvrir', href: '/decouvrir' },
    { label: 'Vision', href: '/vision' },
    { label: 'Atelier', href: '/atelier' },
    { label: 'Méthode', href: '/methode' },
    { label: 'Journal', href: '/journal' },
];

export function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

    return (
        <motion.header
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 rounded-2xl transition-all duration-500 ${
                scrolled ? 'glass shadow-foreground/3 shadow-lg' : 'bg-card/40 backdrop-blur-sm'
            }`}
        >
            <nav className="flex items-center justify-between px-6 py-3" aria-label="Navigation principale">
                <Link href="/" className="group flex items-center gap-2.5" aria-label="Accueil LUMIRIS">
                    <LumirisLogo className="h-7 w-auto" />
                    <span className="text-foreground text-base font-semibold tracking-tight">LUMIRIS</span>
                </Link>

                <ul className="hidden items-center gap-1 lg:flex">
                    {navLinks.map((link) => {
                        const active = isActive(link.href);
                        return (
                            <li key={link.label}>
                                <Link
                                    href={link.href}
                                    className={`relative rounded-lg px-3 py-1.5 text-sm transition-colors duration-200 ${
                                        active
                                            ? 'text-lumiris-cyan font-medium'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {link.label}
                                    {active && (
                                        <motion.div
                                            layoutId="nav-active"
                                            className="bg-lumiris-cyan/10 absolute inset-0 rounded-lg"
                                            style={{ zIndex: -1 }}
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                                        />
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                        <button className="text-foreground lg:hidden" aria-label="Ouvrir le menu">
                            <Menu className="h-5 w-5" />
                        </button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[300px] sm:w-[350px]">
                        <SheetHeader>
                            <SheetTitle className="flex items-center gap-2.5">
                                <LumirisLogo className="h-7 w-auto" />
                                <span className="text-foreground text-base font-semibold tracking-tight">LUMIRIS</span>
                            </SheetTitle>
                        </SheetHeader>
                        <div className="flex flex-col gap-1 px-4 py-6">
                            {navLinks.map((link) => {
                                const active = isActive(link.href);
                                return (
                                    <SheetClose asChild key={link.label}>
                                        <Link
                                            href={link.href}
                                            className={`rounded-lg px-3 py-2.5 text-sm transition-colors ${
                                                active
                                                    ? 'bg-lumiris-cyan/10 text-lumiris-cyan font-medium'
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                            }`}
                                        >
                                            {link.label}
                                        </Link>
                                    </SheetClose>
                                );
                            })}
                        </div>
                    </SheetContent>
                </Sheet>
            </nav>
        </motion.header>
    );
}
