'use client';

import { ChevronDown, UserCog } from 'lucide-react';
import type { AdminUserRole } from '@lumiris/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@lumiris/ui/components/dropdown-menu';
import { cn } from '@lumiris/ui/lib/cn';
import { useAdminUserSwitcher } from '@/lib/auth';

const ROLE_LABEL: Record<AdminUserRole, string> = {
    curator: 'Curateur',
    lead_curator: 'Curateur principal',
    billing_ops: 'Ops facturation',
    platform_admin: 'Admin plateforme',
    dpo: 'DPO',
};

const ROLE_TONE: Record<AdminUserRole, string> = {
    platform_admin: 'text-lumiris-emerald',
    lead_curator: 'text-lumiris-emerald',
    curator: 'text-lumiris-cyan',
    billing_ops: 'text-lumiris-amber',
    dpo: 'text-lumiris-rose',
};

// Dev-only — le gating `process.env.NODE_ENV !== 'production'` est appliqué dans la topbar.
export function DevUserSwitcher() {
    const { currentUser, switchTo, availableUsers } = useAdminUserSwitcher();

    if (!currentUser) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        'flex items-center gap-2 rounded-md border border-dashed border-muted-foreground/40 bg-background px-2.5 py-1.5 text-xs opacity-60 transition-opacity hover:border-muted-foreground/70 hover:opacity-100',
                    )}
                >
                    <UserCog className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                    <span className="font-medium text-foreground">{currentUser.fullName}</span>
                    <span className={cn('font-mono text-[10px]', ROLE_TONE[currentUser.role])}>
                        {ROLE_LABEL[currentUser.role]}
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="font-mono text-[10px] tracking-wider uppercase">
                    Dev - impersonate
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableUsers.map((user) => (
                    <DropdownMenuItem
                        key={user.id}
                        onSelect={() => {
                            void switchTo(user);
                        }}
                        className="flex items-start gap-2"
                    >
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                            {user.fullName
                                .split(' ')
                                .map((s) => s[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-foreground">{user.fullName}</p>
                            <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
                            <p className={cn('mt-0.5 font-mono text-[10px]', ROLE_TONE[user.role])}>
                                {ROLE_LABEL[user.role]}
                            </p>
                        </div>
                        {user.id === currentUser.id ? (
                            <span className="font-mono text-[10px] text-lumiris-emerald">●</span>
                        ) : null}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
