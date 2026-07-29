'use client';

import { Clock, Mail } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import { LumirisLogo } from '@lumiris/ui/components/logo';
import { Card, CardContent } from '@lumiris/ui/components/card';
import { toast } from '@lumiris/ui/components/sonner';
import { signOut } from '@/lib/auth-store';
import { useAuthUserId } from '@/lib/use-auth';
import { useVerificationStore } from '@/lib/verification-store';

export function PendingScreen() {
    const userId = useAuthUserId();
    const getRecord = useVerificationStore((s) => s.getRecord);
    const siret = userId ? (getRecord(userId).siret ?? '—') : '—';

    function handleContact() {
        toast.info('Fonctionnalité non disponible');
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <header className="border-b border-border bg-card">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <LumirisLogo className="h-9 w-auto" />
                        <div>
                            <p className="text-sm leading-none font-semibold text-foreground">LUMIRIS</p>
                            <p className="font-mono text-[10px] tracking-widest text-muted-foreground">ATELIER</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={signOut} className="text-xs text-muted-foreground">
                        Se déconnecter
                    </Button>
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-12">
                <Card className="w-full">
                    <CardContent className="flex flex-col items-center gap-5 p-10 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lumiris-amber/10">
                            <Clock className="h-6 w-6 text-lumiris-amber" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-xl font-semibold text-foreground">Compte en cours de vérification</h1>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                Votre compte est en cours de vérification par nos équipes. Vous recevrez un e-mail dès
                                que votre profil sera validé.
                            </p>
                        </div>

                        <div className="w-full rounded-lg border border-border bg-muted/30 px-4 py-3 text-left">
                            <p className="text-[11px] tracking-wider text-muted-foreground uppercase">SIRET déclaré</p>
                            <p className="mt-0.5 font-mono text-sm text-foreground">
                                {siret.replace(/(\d{3})(?=\d)/g, '$1 ')}
                            </p>
                        </div>

                        <Button variant="outline" onClick={handleContact} className="gap-2">
                            <Mail className="h-4 w-4" />
                            Contacter le support
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
