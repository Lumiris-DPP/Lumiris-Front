'use client';

import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Wrench } from 'lucide-react';
import { z } from 'zod';
import {
    isApiError,
    useClaimRepairer,
    useLogin,
    useRegister,
    useRepairerClaimPreview,
} from '@lumiris/api-client/react';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Card } from '@lumiris/ui/components/card';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { LumirisLogo } from '@lumiris/ui/components/logo';
import { toast } from '@lumiris/ui/components/sonner';
import { signInWithToken, signOut } from '@/lib/auth-store';
import { useAuthHydrated, useAuthRole, useAuthToken } from '@/lib/use-auth';
import { zodFieldErrors } from '@/lib/form-errors';

function formatSiret(siret?: string) {
    return siret ? siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4') : undefined;
}

export function ReclamerClient() {
    const router = useRouter();
    const token = useSearchParams().get('token') ?? '';
    const hydrated = useAuthHydrated();
    const authToken = useAuthToken();
    const role = useAuthRole();

    const preview = useRepairerClaimPreview(token || undefined);
    const claim = useClaimRepairer();
    const [pendingClaim, setPendingClaim] = useState(false);
    const claimStarted = useRef(false);

    function runClaim() {
        if (claimStarted.current) return;
        claimStarted.current = true;
        claim.mutate(
            { token },
            {
                onSuccess: () => router.replace('/onboarding'),
                onError: (err) => {
                    claimStarted.current = false;
                    toast.error(isApiError(err) ? err.message : 'La réclamation a échoué.');
                },
            },
        );
    }

    // Après une inscription/connexion faite sur cette page, enchaîne automatiquement la
    // réclamation une fois le jeton d'auth propagé dans le store.
    useEffect(() => {
        if (pendingClaim && authToken && role === 'repairer') {
            setPendingClaim(false);
            runClaim();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingClaim, authToken, role]);

    if (!token) {
        return (
            <Shell>
                <StatusCard
                    title="Lien invalide"
                    body="Ce lien de réclamation est incomplet. Vérifiez l'e-mail que vous avez reçu."
                />
            </Shell>
        );
    }

    if (!hydrated || preview.isLoading) {
        return (
            <Shell>
                <Card className="rounded-2xl bg-card px-7 py-8 shadow-xl">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                    <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-muted" />
                    <div className="mt-6 h-10 w-full animate-pulse rounded bg-muted" />
                </Card>
            </Shell>
        );
    }

    if (preview.isError || !preview.data) {
        return (
            <Shell>
                <StatusCard
                    title="Lien expiré ou déjà utilisé"
                    body="Cette fiche a peut-être déjà été réclamée. Vous pouvez créer un compte réparateur directement."
                    action={
                        <Button asChild className="h-10 w-full bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90">
                            <Link href="/register">Créer un compte</Link>
                        </Button>
                    }
                />
            </Shell>
        );
    }

    const fiche = preview.data;
    const isRepairer = Boolean(authToken) && role === 'repairer';
    const wrongRole = Boolean(authToken) && role !== null && role !== 'repairer';

    return (
        <Shell>
            <Card className="rounded-2xl bg-card px-7 py-8 shadow-xl">
                <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-lumiris-cyan uppercase">
                    <Wrench className="h-3.5 w-3.5" aria-hidden />
                    Votre atelier est référencé
                </div>
                <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                    {fiche.companyName ?? fiche.displayName ?? 'Votre atelier'}
                </h1>
                <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {[fiche.address, fiche.city].filter(Boolean).join(', ') || fiche.region || '—'}
                </p>
                {formatSiret(fiche.siret) ? (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">SIRET {formatSiret(fiche.siret)}</p>
                ) : null}
                {fiche.specialties && fiche.specialties.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {fiche.specialties.map((s) => (
                            <Badge key={s} variant="outline" className="text-[11px]">
                                {s}
                            </Badge>
                        ))}
                    </div>
                ) : null}

                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                    Réclamez cette fiche pour la compléter, recevoir des demandes de retouche et gérer vos devis. Il
                    restera une étape de vérification (SIRET et pièces justificatives).
                </p>

                {isRepairer ? (
                    <Button
                        onClick={runClaim}
                        disabled={claim.isPending}
                        className="mt-6 h-10 w-full bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90 disabled:opacity-60"
                    >
                        {claim.isPending ? 'Réclamation…' : 'Réclamer ma fiche'}
                    </Button>
                ) : null}

                {wrongRole ? (
                    <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                        Vous êtes connecté avec un compte {role}, qui ne peut pas réclamer une fiche réparateur.
                        <button
                            type="button"
                            onClick={() => signOut()}
                            className="mt-2 block text-lumiris-cyan hover:underline"
                        >
                            Se déconnecter
                        </button>
                    </div>
                ) : null}
            </Card>

            {!authToken ? <AuthPanel onAuthed={() => setPendingClaim(true)} /> : null}
        </Shell>
    );
}

function Shell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <header className="border-b border-border bg-card">
                <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-5">
                    <LumirisLogo className="h-9 w-auto" />
                    <div>
                        <p className="text-sm leading-none font-semibold text-foreground">LUMIRIS</p>
                        <p className="font-mono text-[10px] tracking-widest text-muted-foreground">ATELIER</p>
                    </div>
                </div>
            </header>
            <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-6 py-12">{children}</main>
        </div>
    );
}

function StatusCard({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
    return (
        <Card className="rounded-2xl bg-card px-7 py-8 shadow-xl">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            {action ? <div className="mt-6">{action}</div> : null}
        </Card>
    );
}

const SignupSchema = z.object({
    name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: z.string().email('Adresse e-mail invalide'),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

const LoginSchema = z.object({
    email: z.string().email('Adresse e-mail invalide'),
    password: z.string().min(1, 'Mot de passe requis'),
});

function AuthPanel({ onAuthed }: { onAuthed: () => void }) {
    const [tab, setTab] = useState<'signup' | 'login'>('signup');
    const register = useRegister();
    const login = useLogin();
    const [fields, setFields] = useState({ name: '', email: '', password: '' });
    const [errors, setErrors] = useState<Partial<Record<'name' | 'email' | 'password', string>>>({});

    function set(key: keyof typeof fields, value: string) {
        setFields((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    }

    async function handleSignup(e: SyntheticEvent) {
        e.preventDefault();
        const parsed = SignupSchema.safeParse(fields);
        if (!parsed.success) {
            setErrors(zodFieldErrors<typeof fields>(parsed.error));
            return;
        }
        try {
            const { token, refreshToken, user } = await register.mutateAsync({
                email: parsed.data.email.trim().toLowerCase(),
                password: parsed.data.password,
                name: parsed.data.name.trim(),
                role: 'repairer',
            });
            signInWithToken(user.id, user.artisanId ?? null, user.role, token, refreshToken, user.name ?? null);
            onAuthed();
        } catch (err: unknown) {
            if ((err as { status?: number })?.status === 409) {
                setErrors({ email: 'Un compte existe déjà avec cet e-mail — connectez-vous.' });
                setTab('login');
            } else {
                toast.error('Erreur lors de la création du compte. Veuillez réessayer.');
            }
        }
    }

    async function handleLogin(e: SyntheticEvent) {
        e.preventDefault();
        const parsed = LoginSchema.safeParse({ email: fields.email, password: fields.password });
        if (!parsed.success) {
            setErrors(zodFieldErrors<typeof fields>(parsed.error));
            return;
        }
        try {
            const { token, refreshToken, user } = await login.mutateAsync({
                email: parsed.data.email.trim().toLowerCase(),
                password: parsed.data.password,
            });
            signInWithToken(user.id, user.artisanId ?? null, user.role, token, refreshToken, user.name ?? null);
            onAuthed();
        } catch {
            setErrors({ password: 'E-mail ou mot de passe incorrect.' });
        }
    }

    const pending = register.isPending || login.isPending;

    return (
        <Card className="rounded-2xl bg-card px-7 py-7 shadow-xl">
            <div className="mb-5 flex gap-1 rounded-lg bg-muted p-1 text-sm">
                <button
                    type="button"
                    onClick={() => setTab('signup')}
                    className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
                        tab === 'signup' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                    }`}
                >
                    Créer un compte
                </button>
                <button
                    type="button"
                    onClick={() => setTab('login')}
                    className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
                        tab === 'login' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                    }`}
                >
                    J&apos;ai déjà un compte
                </button>
            </div>

            <form onSubmit={tab === 'signup' ? handleSignup : handleLogin} className="flex flex-col gap-4">
                {tab === 'signup' ? (
                    <Field
                        id="name"
                        label="Nom"
                        value={fields.name}
                        onChange={(v) => set('name', v)}
                        error={errors.name}
                        autoComplete="name"
                    />
                ) : null}
                <Field
                    id="email"
                    label="E-mail"
                    type="email"
                    value={fields.email}
                    onChange={(v) => set('email', v)}
                    error={errors.email}
                    autoComplete="email"
                />
                <Field
                    id="password"
                    label="Mot de passe"
                    type="password"
                    value={fields.password}
                    onChange={(v) => set('password', v)}
                    error={errors.password}
                    autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
                />

                <Button
                    type="submit"
                    disabled={pending}
                    className="mt-1 h-10 w-full bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90 disabled:opacity-60"
                >
                    {pending
                        ? 'Un instant…'
                        : tab === 'signup'
                          ? 'Créer mon compte et réclamer'
                          : 'Se connecter et réclamer'}
                </Button>
            </form>
        </Card>
    );
}

function Field({
    id,
    label,
    value,
    onChange,
    error,
    type = 'text',
    autoComplete,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    type?: string;
    autoComplete?: string;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <Label htmlFor={id} className="text-xs font-semibold text-foreground/80">
                {label}
            </Label>
            <Input
                id={id}
                type={type}
                value={value}
                autoComplete={autoComplete}
                onChange={(e) => onChange(e.target.value)}
                aria-invalid={error ? true : undefined}
            />
            {error ? (
                <p className="text-xs text-destructive" role="alert">
                    {error}
                </p>
            ) : null}
        </div>
    );
}
