'use client';

import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { LumirisLogo } from '@lumiris/ui/components/logo';
import {
    isApiError,
    useArtisanMe,
    useArtisanRegister,
    useSignDeclaration,
    useSubmitArtisanKyb,
    useUploadArtisanKybDocument,
    useRepairerMe,
    useRegisterRepairer,
    useSubmitRepairerKyb,
    useUploadRepairerKybDocument,
} from '@lumiris/api-client/react';
import type { KybDocumentLabel } from '@lumiris/api-client';
import { Button } from '@lumiris/ui/components/button';
import { Card } from '@lumiris/ui/components/card';
import { Checkbox } from '@lumiris/ui/components/checkbox';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import {
    DocumentsCard,
    EntityFields,
    RepresentativeFields,
    defaultKybDraft,
    isEntityDraftValid,
    isRepresentativeDraftValid,
    kybDraftToRequest,
    type KybDraft,
} from '@/features/kyb-form';
import { useAuthUserId, useAuthRole, useAuthToken, useAuthHydrated } from '@/lib/use-auth';
import { signOut } from '@/lib/auth-store';
import { useVerificationStore } from '@/lib/verification-store';

const SIRET_RE = /^\d{14}$/;

type Step = 'entity' | 'representative' | 'documents' | 'validation';

const STEP_LABEL: Record<Step, string> = {
    entity: 'Entité juridique',
    representative: 'Représentant légal',
    documents: 'Documents',
    validation: 'Validation',
};

const STEP_ORDER: readonly Step[] = ['entity', 'representative', 'documents', 'validation'];

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
    const submitArtisanKyb = useSubmitArtisanKyb();
    const uploadArtisanKybDoc = useUploadArtisanKybDocument();
    const registerRepairer = useRegisterRepairer();
    const submitRepairerKyb = useSubmitRepairerKyb();
    const uploadRepairerKybDoc = useUploadRepairerKybDocument();
    // Onboarding only applies to artisan and repairer accounts (KYB simplifié : SIRET puis dossier).
    const isArtisan = role === 'artisan';
    const isRepairer = role === 'repairer';
    // Real mode: same live source of truth as AuthGuard, so the two never disagree on
    // "already submitted" and bounce the user back and forth in a redirect loop.
    const me = useArtisanMe({ enabled: Boolean(token) && isArtisan });
    const repairerMe = useRepairerMe({ enabled: Boolean(token) && isRepairer });

    const [step, setStep] = useState<Step>('entity');
    const siretInputRef = useRef<HTMLInputElement>(null);
    const [siret, setSiret] = useState('');
    const [siretError, setSiretError] = useState('');
    const [draft, setDraft] = useState<KybDraft>(() => defaultKybDraft());
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [kybError, setKybError] = useState<string | null>(null);
    const [uploadingLabel, setUploadingLabel] = useState<KybDocumentLabel | null>(null);

    // Prefills once from whatever the server already knows (a prior partial submission, or a
    // REJECTED/INCOMPLETE dossier being redone) — but only from the *initial* query settlement,
    // never again afterwards. Steps 1-3 are staged client-side only until the final submit, so
    // there's nothing meaningful to re-sync from the server later — in particular, registering
    // the SIRET in step 1 updates `me`/`repairerMe`'s cache, which must NOT re-trigger this and
    // stomp over whatever the user already typed into the entity/representative fields.
    const initializedRef = useRef(false);
    useEffect(() => {
        if (initializedRef.current) return;
        const isLoading = isArtisan ? me.isLoading : isRepairer ? repairerMe.isLoading : false;
        if (isLoading) return;
        initializedRef.current = true;
        const data = isArtisan ? me.data : isRepairer ? repairerMe.data : undefined;
        if (data?.siret) setSiret(data.siret);
        if (data?.kyb) setDraft(defaultKybDraft(data.kyb));
    }, [isArtisan, isRepairer, me.isLoading, me.data, repairerMe.isLoading, repairerMe.data]);

    useEffect(() => {
        if (!hydrated) return;
        if (!userId) {
            router.replace('/login');
            return;
        }
        if (!isArtisan && !isRepairer) {
            router.replace('/dashboard');
            return;
        }
        if (token) {
            const isLoading = isArtisan ? me.isLoading : repairerMe.isLoading;
            if (isLoading) return;
            const fullySubmitted = isArtisan
                ? Boolean(me.data?.declarationSigned && me.data.kyb?.termsAcceptedAt)
                : Boolean(repairerMe.data?.kyb?.termsAcceptedAt);
            const status = isArtisan ? me.data?.status : repairerMe.data?.status;
            // A REJECTED account may resubmit here, so don't bounce it to the workspace even
            // though a prior dossier was already submitted.
            if (fullySubmitted && status !== 'REJECTED') router.replace('/dashboard');
            return;
        }
        const record = getRecord(userId).status;
        if (record !== 'unregistered') router.replace('/dashboard');
    }, [
        hydrated,
        userId,
        isArtisan,
        isRepairer,
        token,
        me.isLoading,
        me.data,
        repairerMe.isLoading,
        repairerMe.data,
        getRecord,
        router,
    ]);

    // The SIRET field is the only control of its step, so land the caret in it.
    useEffect(() => {
        if (step === 'entity') siretInputRef.current?.focus();
    }, [step]);

    if (!hydrated || !userId) return null;
    if (!isArtisan && !isRepairer) return null;
    if (token && (isArtisan ? me.isLoading : repairerMe.isLoading)) return null;

    function updateDraft(patch: Partial<KybDraft>) {
        setDraft((prev) => ({ ...prev, ...patch }));
    }

    function handleLogout() {
        signOut();
        router.replace('/login');
    }

    function handleEntitySubmit(e: SyntheticEvent) {
        e.preventDefault();
        if (!userId) return;
        const clean = siret.replace(/\s/g, '');
        if (!SIRET_RE.test(clean)) {
            setSiretError('Le numéro SIRET doit contenir exactement 14 chiffres.');
            return;
        }
        if (!isEntityDraftValid(draft)) {
            setSiretError('Merci de compléter tous les champs obligatoires.');
            return;
        }
        setSiretError('');
        const onError = (err: unknown) => {
            setSiretError(isApiError(err) ? err.message : 'Impossible de vérifier ce SIRET.');
        };
        if (isRepairer) {
            registerRepairer.mutate({ siret: clean }, { onSuccess: () => setStep('representative'), onError });
            return;
        }
        registerArtisan.mutate(
            { siret: clean },
            {
                onSuccess: (profile) => {
                    setFromProfile(userId, profile);
                    setStep('representative');
                },
                onError,
            },
        );
    }

    function handleRepresentativeSubmit(e: SyntheticEvent) {
        e.preventDefault();
        if (!isRepresentativeDraftValid(draft)) {
            setKybError('Merci de compléter tous les champs obligatoires du représentant légal.');
            return;
        }
        setKybError(null);
        setStep('documents');
    }

    function handleUploadDocument(label: KybDocumentLabel, file: File, expiresAt?: string) {
        setUploadingLabel(label);
        const mutation = isRepairer ? uploadRepairerKybDoc : uploadArtisanKybDoc;
        mutation.mutate(
            { label, file, expiresAt },
            {
                onSettled: () => setUploadingLabel(null),
                onError: (err) => setKybError(isApiError(err) ? err.message : "Échec de l'envoi du document."),
            },
        );
    }

    function handleFinalSubmit(e: SyntheticEvent) {
        e.preventDefault();
        if (!termsAccepted) {
            setKybError("Vous devez accepter les conditions générales d'utilisation.");
            return;
        }
        setKybError(null);
        const payload = kybDraftToRequest(draft, true);
        if (isRepairer) {
            submitRepairerKyb.mutate(payload, {
                onSuccess: () => router.replace('/dashboard'),
                onError: (err) => setKybError(isApiError(err) ? err.message : "Impossible d'envoyer le dossier."),
            });
            return;
        }
        submitArtisanKyb.mutate(payload, {
            onSuccess: (profile) => {
                if (userId) setFromProfile(userId, profile);
                signDeclaration.mutate(undefined, {
                    onSuccess: (signedProfile) => {
                        if (userId) setFromProfile(userId, signedProfile);
                        router.replace('/dashboard');
                    },
                    onError: (err) => {
                        setKybError(isApiError(err) ? err.message : "Impossible d'enregistrer la déclaration.");
                    },
                });
            },
            onError: (err) => setKybError(isApiError(err) ? err.message : "Impossible d'envoyer le dossier."),
        });
    }

    const kybResponse = isRepairer ? repairerMe.data?.kyb : me.data?.kyb;
    const isSubmittingFinal = isRepairer
        ? submitRepairerKyb.isPending
        : submitArtisanKyb.isPending || signDeclaration.isPending;
    const roleLabel = isRepairer ? 'réparateur' : 'artisan';
    const formattedSiret = siret.replace(/\s/g, '').replace(/(\d{3})(?=\d)/g, '$1 ');

    return (
        <div className="bg-background flex min-h-screen flex-col">
            <header className="border-border bg-card border-b">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
                    <div className="flex items-center gap-3">
                        <LumirisLogo className="h-9 w-auto" />
                        <div>
                            <p className="text-foreground text-sm font-semibold leading-none">LUMIRIS</p>
                            <p className="text-muted-foreground font-mono text-[10px] tracking-widest">ATELIER</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
                        Se déconnecter
                    </Button>
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-12">
                {/* Stepper */}
                <div className="mb-8 flex items-center gap-2">
                    {STEP_ORDER.map((s, i) => (
                        <div key={s} className="flex flex-1 items-center gap-2 last:flex-none">
                            <StepDot active={step === s} done={STEP_ORDER.indexOf(step) > i} label={STEP_LABEL[s]} />
                            {i < STEP_ORDER.length - 1 ? <div className="bg-border h-px flex-1" /> : null}
                        </div>
                    ))}
                </div>

                {step === 'entity' && (
                    <Card className="bg-card rounded-2xl px-7 py-8 shadow-xl">
                        <h1 className="text-foreground text-xl font-semibold tracking-tight">Entité juridique</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Renseignez le SIRET et les informations légales de votre{' '}
                            {roleLabel === 'artisan' ? 'atelier' : 'activité'}.
                        </p>

                        <form onSubmit={handleEntitySubmit} className="mt-6 flex flex-col gap-4">
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
                                    ref={siretInputRef}
                                />
                            </div>

                            <EntityFields draft={draft} onChange={updateDraft} />

                            {siretError && (
                                <p className="text-destructive text-xs" role="alert">
                                    {siretError}
                                </p>
                            )}

                            <Button
                                type="submit"
                                disabled={registerArtisan.isPending || registerRepairer.isPending}
                                className="bg-lumiris-cyan hover:bg-lumiris-cyan/90 mt-1 h-10 w-full text-white disabled:opacity-60"
                            >
                                {registerArtisan.isPending || registerRepairer.isPending
                                    ? 'Vérification…'
                                    : 'Continuer'}
                            </Button>
                        </form>
                    </Card>
                )}

                {step === 'representative' && (
                    <Card className="bg-card rounded-2xl px-7 py-8 shadow-xl">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setStep('entity')}
                            className="text-muted-foreground -ml-2 mb-2 h-7 px-2"
                        >
                            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                            Retour
                        </Button>
                        <h1 className="text-foreground text-xl font-semibold tracking-tight">Représentant légal</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Informations sur la personne physique qui représente légalement l&apos;entité.
                        </p>
                        <form onSubmit={handleRepresentativeSubmit} className="mt-6 flex flex-col gap-4">
                            <RepresentativeFields draft={draft} onChange={updateDraft} />
                            {kybError && (
                                <p className="text-destructive text-xs" role="alert">
                                    {kybError}
                                </p>
                            )}
                            <Button
                                type="submit"
                                className="bg-lumiris-cyan hover:bg-lumiris-cyan/90 mt-1 h-10 w-full text-white"
                            >
                                Continuer
                            </Button>
                        </form>
                    </Card>
                )}

                {step === 'documents' && (
                    <div className="flex flex-col gap-5">
                        <Card className="bg-card rounded-2xl px-7 py-8 shadow-xl">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setStep('representative')}
                                className="text-muted-foreground -ml-2 mb-2 h-7 px-2"
                            >
                                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                                Retour
                            </Button>
                            <h1 className="text-foreground text-xl font-semibold tracking-tight">
                                Documents justificatifs
                            </h1>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Ces documents sont vérifiés par notre équipe avant l&apos;activation de votre compte.
                            </p>
                        </Card>

                        <DocumentsCard
                            initialKyb={kybResponse}
                            onUploadDocument={handleUploadDocument}
                            uploadingLabel={uploadingLabel}
                        />

                        <Button
                            type="button"
                            onClick={() => setStep('validation')}
                            className="bg-lumiris-cyan hover:bg-lumiris-cyan/90 h-10 w-full text-white"
                        >
                            Continuer
                        </Button>
                    </div>
                )}

                {step === 'validation' && (
                    <Card className="bg-card rounded-2xl px-7 py-8 shadow-xl">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setStep('documents')}
                            className="text-muted-foreground -ml-2 mb-2 h-7 px-2"
                        >
                            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                            Retour
                        </Button>
                        <h1 className="text-foreground text-xl font-semibold tracking-tight">
                            Déclaration sur l&apos;honneur
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Lisez attentivement et certifiez l&apos;exactitude de vos informations.
                        </p>

                        <div className="border-border bg-muted/30 mt-5 rounded-lg border p-4 text-sm leading-relaxed">
                            <p className="text-foreground font-medium">Déclaration sur l&apos;honneur</p>
                            <p className="text-muted-foreground mt-2 text-[13px]">
                                Je soussigné(e), {roleLabel} enregistré sous le numéro SIRET{' '}
                                <span className="text-foreground font-mono font-semibold">{formattedSiret}</span>,
                                déclare sur l&apos;honneur que :
                            </p>
                            <ul className="text-muted-foreground mt-2 list-inside list-disc space-y-1 text-[13px]">
                                <li>Les informations renseignées sont exactes et sincères.</li>
                                <li>Je suis bien titulaire de l&apos;activité déclarée.</li>
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

                        <form onSubmit={handleFinalSubmit} className="mt-5 flex flex-col gap-5">
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="certified"
                                    checked={termsAccepted}
                                    onCheckedChange={(v) => setTermsAccepted(v === true)}
                                    className="mt-0.5"
                                />
                                <Label htmlFor="certified" className="cursor-pointer text-sm leading-snug">
                                    Je certifie sur l&apos;honneur l&apos;exactitude de ces informations et accepte les
                                    conditions générales de LUMIRIS.
                                </Label>
                            </div>

                            {kybError && (
                                <p className="text-destructive text-xs" role="alert">
                                    {kybError}
                                </p>
                            )}

                            <Button
                                type="submit"
                                disabled={!termsAccepted || isSubmittingFinal}
                                className="bg-lumiris-cyan hover:bg-lumiris-cyan/90 h-10 w-full text-white disabled:opacity-40"
                            >
                                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                                {isSubmittingFinal ? 'Envoi…' : 'Envoyer mon dossier KYB'}
                            </Button>
                        </form>
                    </Card>
                )}

                <div className="text-muted-foreground mt-6 flex items-center justify-center gap-1.5 text-xs">
                    <ShieldCheck className="text-lumiris-cyan h-3.5 w-3.5" />
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
                          ? 'border-lumiris-cyan bg-lumiris-cyan/10 text-lumiris-cyan border-2'
                          : 'bg-muted text-muted-foreground border-border border',
                ].join(' ')}
            >
                {done ? <CheckCircle2 className="h-4 w-4" /> : active ? '●' : '○'}
            </div>
            <span className="text-muted-foreground text-center text-[9px] font-medium uppercase leading-tight tracking-wider">
                {label}
            </span>
        </div>
    );
}
