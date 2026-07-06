'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { isApiError, useArtisanMe, useArtisanRegister, useSignDeclaration } from '@lumiris/api-client/react';
import { Button } from '@lumiris/ui/components/button';
import { Card } from '@lumiris/ui/components/card';
import { Checkbox } from '@lumiris/ui/components/checkbox';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { useAuthUserId, useAuthRole, useAuthToken, useAuthHydrated } from '@/lib/use-auth';
import { useVerificationStore } from '@/lib/verification-store';

const SIRET_RE = /^\d{14}$/;

type Step = 'siret' | 'declaration';

export default function OnboardingPage() {
    const router = useRouter();
    const hydrated = useAuthHydrated();
    const userId = useAuthUserId();
    const role = useAuthRole();
    const token = useAuthToken();
    const getRecord = useVerificationStore((s) => s.getRecord);
    const setFromProfile = useVerificationStore((s) => s.setFromProfile);
    const registerArtisan = useArtisanRegister();
    const signDeclaration = useSignDeclaration();
    // KYB onboarding only applies to artisan accounts.
    const isArtisan = role === 'artisan';
    // Real mode: same live source of truth as AuthGuard, so the two never disagree on
    // "already submitted" and bounce the user back and forth in a redirect loop.
    const me = useArtisanMe({ enabled: Boolean(token) && isArtisan });

    const [step, setStep] = useState<Step>('siret');
    const [siret, setSiret] = useState('');
    const [siretError, setSiretError] = useState('');
    const [certified, setCertified] = useState(false);

    useEffect(() => {
        // Resume at step 2 if SIRET was already submitted but the declaration wasn't signed yet.
        if (me.data?.siret && !me.data.declarationSigned) {
            setSiret(me.data.siret);
            setStep('declaration');
        }
    }, [me.data]);

    useEffect(() => {
        if (!hydrated) return;
        if (!userId) {
            router.replace('/login');
            return;
        }
        if (!isArtisan) {
            router.replace('/dashboard');
            return;
        }
        if (token) {
            if (me.isLoading) return;
            if (me.data?.declarationSigned) router.replace('/dashboard');
            return;
        }
        const status = getRecord(userId).status;
        if (status !== 'unregistered') router.replace('/dashboard');
    }, [hydrated, userId, isArtisan, token, me.isLoading, me.data, getRecord, router]);

    if (!hydrated || !userId) return null;
    if (!isArtisan) return null;
    if (token && me.isLoading) return null;

    function handleSiretSubmit(e: FormEvent) {
        e.preventDefault();
        if (!userId) return;
        const clean = siret.replace(/\s/g, '');
        if (!SIRET_RE.test(clean)) {
            setSiretError('Le numéro SIRET doit contenir exactement 14 chiffres.');
            return;
        }
        setSiretError('');
        registerArtisan.mutate(
            { siret: clean },
            {
                onSuccess: (profile) => {
                    setFromProfile(userId, profile);
                    setStep('declaration');
                },
                onError: (err) => {
                    setSiretError(isApiError(err) ? err.message : 'Impossible de vérifier ce SIRET.');
                },
            },
        );
    }

    function handleDeclarationSubmit(e: FormEvent) {
        e.preventDefault();
        if (!userId) return;
        signDeclaration.mutate(undefined, {
            onSuccess: (profile) => {
                setFromProfile(userId, profile);
                router.push('/dashboard');
            },
            onError: (err) => {
                setSiretError(isApiError(err) ? err.message : "Impossible d'enregistrer la déclaration.");
            },
        });
    }

    return (
        <div className="bg-background flex min-h-screen flex-col">
            <header className="border-border bg-card border-b">
                <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-5">
                    <div className="bg-lumiris-emerald flex h-9 w-9 items-center justify-center rounded-lg">
                        <Sparkles className="text-primary-foreground h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-foreground text-sm font-semibold leading-none">LUMIRIS</p>
                        <p className="text-muted-foreground font-mono text-[10px] tracking-widest">ATELIER</p>
                    </div>
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-12">
                {/* Stepper */}
                <div className="mb-8 flex items-center gap-3">
                    <StepDot active={step === 'siret'} done={step === 'declaration'} label="SIRET" />
                    <div className="bg-border h-px flex-1" />
                    <StepDot active={step === 'declaration'} done={false} label="Déclaration" />
                </div>

                {step === 'siret' && (
                    <Card className="bg-card rounded-2xl px-7 py-8 shadow-xl">
                        <h1 className="text-foreground text-xl font-semibold tracking-tight">Numéro SIRET</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Entrez le numéro SIRET de votre atelier pour initialiser votre compte.
                        </p>

                        <form onSubmit={handleSiretSubmit} className="mt-6 flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="siret" className="text-foreground/80 text-xs font-semibold">
                                    Numéro SIRET (14 chiffres)
                                </Label>
                                <Input
                                    id="siret"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="\d*"
                                    maxLength={17}
                                    placeholder="123 456 789 01234"
                                    value={siret}
                                    onChange={(e) => {
                                        setSiret(e.target.value);
                                        setSiretError('');
                                    }}
                                    aria-invalid={siretError ? true : undefined}
                                    autoFocus
                                />
                                {siretError && (
                                    <p className="text-destructive text-xs" role="alert">
                                        {siretError}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={registerArtisan.isPending}
                                className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 mt-1 h-10 w-full text-white disabled:opacity-60"
                            >
                                {registerArtisan.isPending ? 'Vérification…' : 'Continuer'}
                            </Button>
                        </form>
                    </Card>
                )}

                {step === 'declaration' && (
                    <Card className="bg-card rounded-2xl px-7 py-8 shadow-xl">
                        <h1 className="text-foreground text-xl font-semibold tracking-tight">
                            Déclaration sur l&apos;honneur
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Lisez attentivement et certifiez l&apos;exactitude de vos informations.
                        </p>

                        <div className="border-border bg-muted/30 mt-5 rounded-lg border p-4 text-sm leading-relaxed">
                            <p className="text-foreground font-medium">Déclaration sur l&apos;honneur</p>
                            <p className="text-muted-foreground mt-2 text-[13px]">
                                Je soussigné(e), artisan enregistré sous le numéro SIRET{' '}
                                <span className="text-foreground font-mono font-semibold">
                                    {siret.replace(/\s/g, '').replace(/(\d{3})(?=\d)/g, '$1 ')}
                                </span>
                                , déclare sur l&apos;honneur que :
                            </p>
                            <ul className="text-muted-foreground mt-2 list-inside list-disc space-y-1 text-[13px]">
                                <li>Les informations renseignées sont exactes et sincères.</li>
                                <li>Je suis bien titulaire de l&apos;activité artisanale déclarée.</li>
                                <li>Je m&apos;engage à signaler toute modification de ma situation.</li>
                                <li>
                                    J&apos;ai pris connaissance des Conditions Générales d&apos;Utilisation de LUMIRIS.
                                </li>
                            </ul>
                            <p className="text-muted-foreground mt-3 text-[12px] italic">
                                Toute fausse déclaration m&apos;expose aux sanctions prévues par l&apos;article 441-1 du
                                Code pénal.
                            </p>
                        </div>

                        <form onSubmit={handleDeclarationSubmit} className="mt-5 flex flex-col gap-5">
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="certified"
                                    checked={certified}
                                    onCheckedChange={(v) => setCertified(v === true)}
                                    className="mt-0.5"
                                />
                                <Label htmlFor="certified" className="cursor-pointer text-sm leading-snug">
                                    Je certifie sur l&apos;honneur l&apos;exactitude de ces informations et accepte les
                                    conditions générales de LUMIRIS.
                                </Label>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setStep('siret')}
                                >
                                    Retour
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!certified || signDeclaration.isPending}
                                    className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 flex-1 text-white disabled:opacity-40"
                                >
                                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                                    {signDeclaration.isPending ? 'Envoi…' : "Finaliser l'inscription"}
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                <div className="text-muted-foreground mt-6 flex items-center justify-center gap-1.5 text-xs">
                    <ShieldCheck className="text-lumiris-emerald h-3.5 w-3.5" />
                    Vos données sont protégées — conformité RGPD
                </div>
            </main>
        </div>
    );
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
    return (
        <div className="flex flex-col items-center gap-1">
            <div
                className={[
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                    done
                        ? 'bg-lumiris-emerald text-white'
                        : active
                          ? 'border-lumiris-emerald bg-lumiris-emerald/10 text-lumiris-emerald border-2'
                          : 'bg-muted text-muted-foreground border-border border',
                ].join(' ')}
            >
                {done ? <CheckCircle2 className="h-4 w-4" /> : active ? '●' : '○'}
            </div>
            <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">{label}</span>
        </div>
    );
}
