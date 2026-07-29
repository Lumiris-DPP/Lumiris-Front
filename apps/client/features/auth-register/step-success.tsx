'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';

interface StepSuccessProps {
    name: string;
}

export function StepSuccess({ name }: StepSuccessProps) {
    const router = useRouter();
    const firstName = name.split(' ')[0] ?? name;

    useEffect(() => {
        const timer = setTimeout(() => router.replace('/dashboard'), 3000);
        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="flex flex-col items-center gap-6 py-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lumiris-emerald/10">
                <CheckCircle2 className="h-8 w-8 text-lumiris-emerald" />
            </div>

            <div>
                <h2 className="text-lg font-semibold text-foreground">Bienvenue {firstName} !</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Votre compte a été créé avec succès.
                    <br />
                    Vous allez être redirigé vers le tableau de bord…
                </p>
            </div>

            <Button
                onClick={() => router.replace('/dashboard')}
                className="h-10 w-full bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90"
            >
                Aller au tableau de bord
            </Button>
        </div>
    );
}
