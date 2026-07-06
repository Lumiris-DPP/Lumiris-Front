'use client';

import { Clock, Mail, Sparkles } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
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
        <div className="bg-background flex min-h-screen flex-col">
            <header className="border-border bg-card border-b">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="bg-lumiris-emerald flex h-9 w-9 items-center justify-center rounded-lg">
                            <Sparkles className="text-primary-foreground h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-foreground text-sm font-semibold leading-none">LUMIRIS</p>
                            <p className="text-muted-foreground font-mono text-[10px] tracking-widest">ATELIER</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground text-xs">
                        Se déconnecter
                    </Button>
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-12">
                <Card className="w-full">
                    <CardContent className="flex flex-col items-center gap-5 p-10 text-center">
                        <div className="bg-lumiris-amber/10 flex h-14 w-14 items-center justify-center rounded-full">
                            <Clock className="text-lumiris-amber h-6 w-6" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-foreground text-xl font-semibold">Compte en cours de vérification</h1>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Votre compte est en cours de vérification par nos équipes. Vous recevrez un e-mail dès
                                que votre profil sera validé.
                            </p>
                        </div>

                        <div className="border-border bg-muted/30 w-full rounded-lg border px-4 py-3 text-left">
                            <p className="text-muted-foreground text-[11px] uppercase tracking-wider">SIRET déclaré</p>
                            <p className="text-foreground mt-0.5 font-mono text-sm">
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
