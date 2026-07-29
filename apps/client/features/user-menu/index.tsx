'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon, Wallet } from 'lucide-react';
import type { Artisan } from '@lumiris/types';
import { Avatar, AvatarFallback, AvatarImage } from '@lumiris/ui/components/avatar';
import { Button } from '@lumiris/ui/components/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@lumiris/ui/components/dropdown-menu';
import { signOut } from '@/lib/auth-store';

interface UserMenuProps {
    artisan: Artisan;
}

export function UserMenu({ artisan }: UserMenuProps) {
    const router = useRouter();
    const initials =
        artisan.displayName
            .split(' ')
            .map((part) => part[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase() || '?';

    function handleSignOut() {
        signOut();
        router.push('/login');
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Mon compte"
                    className="h-9 w-9 rounded-full p-0 hover:bg-transparent"
                >
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={artisan.photoUrl} alt={artisan.displayName} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground">{artisan.displayName}</span>
                    <span className="text-xs font-normal text-muted-foreground">{artisan.atelierName}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile">
                        <UserIcon className="h-4 w-4" />
                        Mon profil
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/subscription">
                        <Wallet className="h-4 w-4" />
                        Mon abonnement
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                    Se déconnecter
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
