'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LumirisLogo } from '@lumiris/ui/components/logo';
import { useAuthArtisanId, useAuthHydrated } from '@/lib/use-auth';
import { LoginCard, EsprTimelinePopover } from '@/features/auth-login';

export default function LoginPage() {
    const router = useRouter();
    const hydrated = useAuthHydrated();
    const artisanId = useAuthArtisanId();

    useEffect(() => {
        if (hydrated && artisanId) router.replace('/dashboard');
    }, [hydrated, artisanId, router]);

    if (!hydrated || artisanId) return null;

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <header className="border-b border-border bg-card">
                <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-5">
                    <LumirisLogo className="h-9 w-auto" />
                    <div>
                        <p className="text-sm leading-none font-semibold text-foreground">LUMIRIS</p>
                        <p className="font-mono text-[10px] tracking-widest text-muted-foreground">ATELIER</p>
                    </div>
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-12">
                <LoginCard />
                <EsprTimelinePopover />
            </main>
        </div>
    );
}
