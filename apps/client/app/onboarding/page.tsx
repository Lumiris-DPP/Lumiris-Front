'use client';

import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { LumirisLogo } from '@lumiris/ui/components/logo';
import { isApiError, useArtisanMe, useArtisanRegister, useSignDeclaration } from '@lumiris/api-client/react';
import { Button } from '@lumiris/ui/components/button';
import { Card } from '@lumiris/ui/components/card';
import { Checkbox } from '@lumiris/ui/components/checkbox';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { useAuthUserId, useAuthRole, useAuthToken, useAuthHydrated } from '@/lib/use-auth';
import { signOut } from '@/lib/auth-store';
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
    const siretInputRef = useRef<HTMLInputElement>(null);
    const [siret, setSiret] = useState('');
    const [siretError, setSiretError] = useState('');
    const [certified, setCertified] = useState(false);

    useEffect(() => {
        if (!me.data) return;
        // A REJECTED artisan is starting a fresh dossier: prefill their known SIRET but keep
        // them on step 1 so they can re-submit (the backend upserts on re-register).
        if (me.data.status === 'REJECTED') {
            if (me.data.siret) setSiret(me.data.siret);
            setStep('siret');
            return;
        }
        // Resume at step 2 if SIRET was already submitted but the declaration wasn't signed yet.
        if (me.data.siret && !me.data.declarationSigned) {
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
            // A REJECTED artisan may resubmit here, so don't bounce them to the workspace even
            // though they previously signed the declaration.
            if (me.data?.declarationSigned && me.data.status !== 'REJECTED') router.replace('/dashboard');
            return;
        }
        const status = getRecord(userId).status;
        if (status !== 'unregistered') router.replace('/dashboard');
    }, [hydrated, userId, isArtisan, token, me.isLoading, me.data, getRecord, router]);

    // The SIRET field is the only control of its step, so land the caret in it.
    useEffect(() => {
        if (step === 'siret') siretInputRef.current?.focus();
    }, [step]);

    if (!hydrated || !userId) return null;
    if (!isArtisan) return null;
    if (token && me.isLoading) return null;

    function handleSiretSubmit(e: SyntheticEvent) {
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

    function handleLogout() {
        signOut();
        router.replace('/login');
    }

    function handleDeclarationSubmit(e: SyntheticEvent) {
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
        <div className="flex min-h-screen flex-col bg-background">
            <header className="border-b border-border bg-card">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
                    <div className="flex items-center gap-3">
                        <LumirisLogo className="h-9 w-auto" />
                        <div>
                            <p className="text-sm leading-none font-semibold text-foreground">LUMIRIS</p>
                            <p className="font-mono text-[10px] tracking-widest text-muted-foreground">ATELIER</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
                        Se déconnecter
                    </Button>
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-12">
                {/* Stepper */}
                <div className="mb-8 flex items-center gap-3">
                    <StepDot active={step === 'siret'} done={step === 'declaration'} label="SIRET" />
                    <div className="h-px flex-1 bg-border" />
                    <StepDot active={step === 'declaration'} done={false} label="Déclaration" />
                </div>

                {step === 'siret' && (
                    <Card className="rounded-2xl bg-card px-7 py-8 shadow-xl">
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">Numéro SIRET</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Entrez le numéro SIRET de votre atelier pour initialiser votre compte.
                        </p>

                        <form onSubmit={handleSiretSubmit} className="mt-6 flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="siret" className="text-xs font-semibold text-foreground/80">
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
                                    ref={siretInputRef}
                                />
                                {siretError && (
                                    <p className="text-xs text-destructive" role="alert">
                                        {siretError}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={registerArtisan.isPending}
                                className="mt-1 h-10 w-full bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90 disabled:opacity-60"
                            >
                                {registerArtisan.isPending ? 'Vérification…' : 'Continuer'}
                            </Button>
                        </form>
                    </Card>
                )}

                {step === 'declaration' && (
                    <Card className="rounded-2xl bg-card px-7 py-8 shadow-xl">
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">
                            Déclaration sur l&apos;honneur
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Lisez attentivement et certifiez l&apos;exactitude de vos informations.
                        </p>

                        <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed">
                            <p className="font-medium text-foreground">Déclaration sur l&apos;honneur</p>
                            <p className="mt-2 text-[13px] text-muted-foreground">
                                Je soussigné(e), artisan enregistré sous le numéro SIRET{' '}
                                <span className="font-mono font-semibold text-foreground">
                                    {siret.replace(/\s/g, '').replace(/(\d{3})(?=\d)/g, '$1 ')}
                                </span>
                                , déclare sur l&apos;honneur que :
                            </p>
                            <ul className="mt-2 list-inside list-disc space-y-1 text-[13px] text-muted-foreground">
                                <li>Les informations renseignées sont exactes et sincères.</li>
                                <li>Je suis bien titulaire de l&apos;activité artisanale déclarée.</li>
                                <li>Je m&apos;engage à signaler toute modification de ma situation.</li>
                                <li>
                                    J&apos;ai pris connaissance des Conditions Générales d&apos;Utilisation de LUMIRIS.
                                </li>
                            </ul>
                            <p className="mt-3 text-[12px] text-muted-foreground italic">
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
                                    className="flex-1 bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90 disabled:opacity-40"
                                >
                                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                                    {signDeclaration.isPending ? 'Envoi…' : "Finaliser l'inscription"}
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-lumiris-cyan" />
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
                        ? 'bg-lumiris-cyan text-white'
                        : active
                          ? 'border-2 border-lumiris-cyan bg-lumiris-cyan/10 text-lumiris-cyan'
                          : 'border border-border bg-muted text-muted-foreground',
                ].join(' ')}
            >
                {done ? <CheckCircle2 className="h-4 w-4" /> : active ? '●' : '○'}
            </div>
            <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">{label}</span>
        </div>
    );
}
