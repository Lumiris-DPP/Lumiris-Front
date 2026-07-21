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
            <div className="bg-lumiris-emerald/10 flex h-16 w-16 items-center justify-center rounded-full">
                <CheckCircle2 className="text-lumiris-emerald h-8 w-8" />
            </div>

            <div>
                <h2 className="text-foreground text-lg font-semibold">Bienvenue {firstName} !</h2>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    Votre compte a été créé avec succès.
                    <br />
                    Vous allez être redirigé vers le tableau de bord…
                </p>
            </div>

            <Button
                onClick={() => router.replace('/dashboard')}
                className="bg-lumiris-cyan hover:bg-lumiris-cyan/90 h-10 w-full text-white"
            >
                Aller au tableau de bord
            </Button>
        </div>
    );
}
