'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import type { UserRole } from '@lumiris/types';
import { Button } from '@lumiris/ui/components/button';

const REDIRECT_DELAY_MS = 3000;

interface StepSuccessProps {
    name: string;
    role: UserRole;
}

export function StepSuccess({ name, role }: StepSuccessProps) {
    const router = useRouter();
    const firstName = name.split(' ')[0] ?? name;

    const next =
        role === 'artisan'
            ? {
                  href: '/onboarding',
                  label: 'Vérifier mon atelier',
                  description:
                      'Il reste une étape : vérifier votre atelier avec son SIRET. Le tableau de bord s’ouvre juste après.',
              }
            : {
                  href: '/dashboard',
                  label: 'Aller au tableau de bord',
                  description: 'Vous allez être redirigé vers le tableau de bord…',
              };

    useEffect(() => {
        const timer = setTimeout(() => router.replace(next.href), REDIRECT_DELAY_MS);
        return () => clearTimeout(timer);
    }, [router, next.href]);

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
                    {next.description}
                </p>
            </div>

            <Button
                onClick={() => router.replace(next.href)}
                className="h-10 w-full bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90"
            >
                {next.label}
            </Button>
        </div>
    );
}
