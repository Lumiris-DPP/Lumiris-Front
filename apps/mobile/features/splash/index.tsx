'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LumirisLogo } from '@lumiris/ui/components/logo';
import { IridescentBackground } from '@/lib/motion';
import { hasCompletedOnboarding } from '@/lib/onboarding/storage';

const SPLASH_DURATION_MS = 700;

type SplashState = 'pending' | 'redirect' | 'done';

interface SplashProps {
    children: React.ReactNode;
}

export function Splash({ children }: SplashProps) {
    const router = useRouter();
    const [state, setState] = useState<SplashState>('pending');

    useEffect(() => {
        const completed = hasCompletedOnboarding();

        if (!completed) {
            setState('redirect');
            router.replace('/onboarding');
            return;
        }

        const reduceMotion =
            typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (reduceMotion) {
            setState('done');
            return;
        }

        const timer = setTimeout(() => setState('done'), SPLASH_DURATION_MS);
        return () => clearTimeout(timer);
    }, [router]);

    if (state === 'done') {
        return <>{children}</>;
    }

    return <SplashScreen />;
}

function SplashScreen() {
    return (
        <div
            role="status"
            aria-label="Chargement de LUMIRIS Vision"
            className="bg-background relative flex h-full flex-col items-center justify-center overflow-hidden"
        >
            <IridescentBackground intensity="subtle" />

            <div className="relative flex items-center justify-center motion-reduce:contents">
                <motion.div
                    aria-hidden
                    className="absolute h-44 w-44 rounded-full motion-reduce:hidden"
                    style={{
                        background:
                            'conic-gradient(from 0deg, oklch(60% 0.13 195deg / 14%), oklch(55% 0.18 160deg / 8%), oklch(72% 0.16 85deg / 4%), transparent, oklch(60% 0.13 195deg / 14%))',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                />

                <div
                    aria-hidden
                    className="border-border/50 bg-glass relative flex h-40 w-40 items-center justify-center rounded-full border backdrop-blur-2xl"
                    style={{ animation: 'iris-breathe 2.4s ease-in-out infinite' }}
                >
                    <div className="border-border/25 pointer-events-none absolute h-[80%] w-[80%] rounded-full border" />
                    <div className="border-border/15 pointer-events-none absolute h-[62%] w-[62%] rounded-full border" />
                    <div className="border-border/10 pointer-events-none absolute h-[44%] w-[44%] rounded-full border" />
                    <LumirisLogo title="" className="relative h-14 w-auto" />
                </div>
            </div>

            <div className="relative z-10 mt-8 flex flex-col items-center">
                <p className="text-foreground text-lg font-bold tracking-tight">LUMIRIS</p>
                <p className="text-muted-foreground mt-1 text-[10px] font-semibold uppercase tracking-[0.32em]">
                    Vision
                </p>
            </div>
        </div>
    );
}
