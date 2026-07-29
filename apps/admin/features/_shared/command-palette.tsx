'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command, Search, X } from 'lucide-react';
import type { AdminUserRole } from '@lumiris/types';
import { cn } from '@lumiris/ui/lib/cn';
import { useCurrentUser } from '@/lib/auth';
import { can } from '@/lib/auth/permissions';
import { NAV_GROUPS, type NavRoute } from './nav-routes';

interface FlatItem {
    readonly group: string;
    readonly route: NavRoute;
}

function buildItems(role: AdminUserRole): readonly FlatItem[] {
    return NAV_GROUPS.flatMap((group) =>
        group.routes.filter((route) => can(role, route.requires)).map((route) => ({ group: group.label, route })),
    );
}

function CommandPaletteComponent() {
    const router = useRouter();
    const user = useCurrentUser();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const chordBuffer = useRef<{ key: string; expiresAt: number } | null>(null);

    const items = useMemo(() => (user ? buildItems(user.role) : []), [user]);

    const filtered = useMemo(() => {
        if (!query.trim()) return items;
        const q = query.trim().toLowerCase();
        return items.filter(
            (item) =>
                item.route.label.toLowerCase().includes(q) ||
                item.group.toLowerCase().includes(q) ||
                item.route.href.toLowerCase().includes(q),
        );
    }, [items, query]);

    const close = useCallback(() => {
        setOpen(false);
        setQuery('');
        setActiveIndex(0);
    }, []);

    const navigate = useCallback(
        (href: string) => {
            router.push(href);
            close();
        },
        [router, close],
    );

    useEffect(() => {
        function isTypingInField(target: EventTarget | null): boolean {
            if (!(target instanceof HTMLElement)) return false;
            const tag = target.tagName;
            return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
        }

        function onKeyDown(event: KeyboardEvent) {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setOpen((prev) => !prev);
                return;
            }
            if (event.key === 'Escape' && open) {
                close();
                return;
            }
            if (open) return;
            if (isTypingInField(event.target)) return;
            if (event.metaKey || event.ctrlKey || event.altKey) return;

            const now = Date.now();
            const buffered = chordBuffer.current;
            if (buffered && buffered.expiresAt > now) {
                const match = items.find(
                    (item) =>
                        item.route.shortcut &&
                        item.route.shortcut[0] === buffered.key &&
                        item.route.shortcut[1] === event.key.toLowerCase(),
                );
                chordBuffer.current = null;
                if (match) {
                    event.preventDefault();
                    router.push(match.route.href);
                }
                return;
            }
            if (event.key.toLowerCase() === 'g') {
                chordBuffer.current = { key: 'g', expiresAt: now + 1500 };
            }
        }

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, close, items, router]);

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    useEffect(() => {
        setActiveIndex(0);
    }, [query]);

    const onKeyDownInList = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (event.key === 'Enter') {
                event.preventDefault();
                const target = filtered[activeIndex];
                if (target) navigate(target.route.href);
            }
        },
        [filtered, activeIndex, navigate],
    );

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-lumiris-cyan/40 hover:text-foreground"
            >
                <Search className="h-3.5 w-3.5" aria-hidden />
                <span>Rechercher…</span>
                <kbd className="ml-6 flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    <Command className="h-2.5 w-2.5" aria-hidden />K
                </kbd>
            </button>

            <>
                {open && (
                    <>
                        <button
                            type="button"
                            aria-label="Fermer la palette de commandes"
                            className="fixed inset-0 z-50 bg-foreground/10 backdrop-blur-sm"
                            onClick={close}
                        />
                        <div
                            role="dialog"
                            aria-label="Palette de commandes"
                            className="fixed top-[20%] left-1/2 z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
                        >
                            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                                <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
                                <input
                                    ref={inputRef}
                                    aria-label="Rechercher un module"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={onKeyDownInList}
                                    placeholder="Rechercher un module…"
                                    className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground/60 outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={close}
                                    className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    aria-label="Fermer la palette"
                                >
                                    <X className="h-4 w-4" aria-hidden />
                                </button>
                            </div>
                            <div className="max-h-72 overflow-y-auto p-2">
                                {filtered.map((item, index) => (
                                    <button
                                        type="button"
                                        key={item.route.href}
                                        onClick={() => navigate(item.route.href)}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors',
                                            index === activeIndex
                                                ? 'bg-lumiris-cyan/8 text-lumiris-cyan'
                                                : 'hover:bg-muted',
                                        )}
                                    >
                                        <item.route.icon className="h-4 w-4" aria-hidden />
                                        <span className="font-medium">{item.route.label}</span>
                                        <span className="ml-2 text-xs text-muted-foreground/60">{item.group}</span>
                                        {item.route.shortcut ? (
                                            <span className="ml-auto flex items-center gap-1">
                                                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                                                    {item.route.shortcut[0]}
                                                </kbd>
                                                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                                                    {item.route.shortcut[1]}
                                                </kbd>
                                            </span>
                                        ) : null}
                                    </button>
                                ))}
                                {filtered.length === 0 && (
                                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                                        Aucun résultat.
                                    </p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </>
        </>
    );
}

export const CommandPalette = memo(CommandPaletteComponent);
