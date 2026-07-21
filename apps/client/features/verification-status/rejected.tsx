'use client';

import { useRouter } from 'next/navigation';
import { Mail, XCircle } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import { LumirisLogo } from '@lumiris/ui/components/logo';
import { Card, CardContent } from '@lumiris/ui/components/card';
import { toast } from '@lumiris/ui/components/sonner';
import { signOut } from '@/lib/auth-store';
import { useAuthUserId } from '@/lib/use-auth';
import { useVerificationStore } from '@/lib/verification-store';

export function RejectedScreen() {
    const router = useRouter();
    const userId = useAuthUserId();
    const getRecord = useVerificationStore((s) => s.getRecord);
    const reset = useVerificationStore((s) => s.reset);
    const rejectionReason = userId ? getRecord(userId).rejectionReason : null;

    function handleContact() {
        toast.info('Fonctionnalité non disponible');
    }

    // Actually restart onboarding: clear the local verification flag (so demo mode shows the
    // form) and navigate to /onboarding. In real mode the onboarding page lets a REJECTED
    // artisan re-submit a SIRET (backend upserts on re-register), moving them back to PENDING.
    function handleResubmit() {
        if (!userId) return;
        reset(userId);
        router.push('/onboarding');
    }

    return (
        <div className="bg-background flex min-h-screen flex-col">
            <header className="border-border bg-card border-b">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <LumirisLogo className="h-9 w-auto" />
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
                        <div className="bg-lumiris-rose/10 flex h-14 w-14 items-center justify-center rounded-full">
                            <XCircle className="text-lumiris-rose h-6 w-6" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-foreground text-xl font-semibold">Validation refusée</h1>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Votre demande de validation n&apos;a pas pu être approuvée. Contactez notre support pour
                                obtenir plus d&apos;informations ou soumettez un nouveau dossier.
                            </p>
                        </div>

                        <div className="border-lumiris-rose/20 bg-lumiris-rose/5 w-full rounded-lg border px-4 py-3 text-left">
                            <p className="text-lumiris-rose text-[12px] leading-relaxed">
                                {rejectionReason ??
                                    "Si vous pensez qu'il s'agit d'une erreur, contactez-nous avec votre numéro SIRET."}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={handleContact} className="gap-2">
                                <Mail className="h-4 w-4" />
                                Contacter le support
                            </Button>
                            <Button
                                onClick={handleResubmit}
                                className="bg-lumiris-cyan hover:bg-lumiris-cyan/90 gap-2 text-white"
                            >
                                Nouveau dossier
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
