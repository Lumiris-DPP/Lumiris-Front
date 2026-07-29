'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@lumiris/ui/components/card';
import { LumirisLogo } from '@lumiris/ui/components/logo';
import { RegisterForm } from '@/features/auth-register';
import { useAuthArtisanId, useAuthHydrated } from '@/lib/use-auth';

export default function RegisterPage() {
    const router = useRouter();
    const hydrated = useAuthHydrated();
    const artisanId = useAuthArtisanId();

    useEffect(() => {
        if (hydrated && artisanId) {
            router.replace('/dashboard');
        }
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
                <Card className="rounded-2xl bg-card px-7 py-8 shadow-xl">
                    <RegisterForm />
                </Card>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    Déjà un compte ?{' '}
                    <Link href="/login" className="text-lumiris-cyan hover:underline">
                        Se connecter
                    </Link>
                </p>
            </main>
        </div>
    );
}
