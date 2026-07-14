'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useLogin, useRegister } from '@lumiris/api-client/react';
import { Button } from '@lumiris/ui/components/button';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { GlassCard, IridescentBackground, slideUpFade } from '@/lib/motion';
import { useUser } from '@/lib/auth';

const MIN_SIGNUP_PASSWORD_LENGTH = 8;

function SignInForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { signIn } = useUser();
    const loginMutation = useLogin();
    const registerMutation = useRegister();
    const isSignup = searchParams.get('mode') === 'signup';
    const isPending = loginMutation.isPending || registerMutation.isPending;

    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedName = displayName.trim();
        if (!trimmedEmail.includes('@')) {
            setError('Adresse e-mail invalide.');
            return;
        }
        if (isSignup && trimmedName.length < 2) {
            setError('Indique un prénom (2 caractères minimum).');
            return;
        }
        if (isSignup && password.length < MIN_SIGNUP_PASSWORD_LENGTH) {
            setError('Le mot de passe doit contenir au moins 8 caractères.');
            return;
        }
        if (!isSignup && password.length < 1) {
            setError('Mot de passe requis.');
            return;
        }
        setError(null);

        try {
            const { token, refreshToken, user } = isSignup
                ? await registerMutation.mutateAsync({
                      email: trimmedEmail,
                      password,
                      name: trimmedName,
                      role: 'consumer',
                  })
                : await loginMutation.mutateAsync({ email: trimmedEmail, password });
            signIn(user, token, refreshToken);
            router.push(isSignup ? '/onboarding/profile' : '/');
        } catch (err: unknown) {
            const status = (err as { status?: number })?.status;
            if (isSignup && status === 409) {
                setError('Un compte existe déjà avec cet e-mail.');
            } else if (!isSignup) {
                setError('Email ou mot de passe incorrect.');
            } else {
                setError('Erreur lors de la création du compte. Réessaie.');
            }
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-foreground/80 text-xs font-semibold">
                    E-mail
                </Label>
                <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="toi@exemple.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={error !== null && !email.includes('@')}
                    required
                />
            </div>
            {isSignup ? (
                <div className="flex flex-col gap-2">
                    <Label htmlFor="displayName" className="text-foreground/80 text-xs font-semibold">
                        Prénom
                    </Label>
                    <Input
                        id="displayName"
                        type="text"
                        autoComplete="given-name"
                        placeholder="Camille"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        aria-invalid={error !== null && displayName.trim().length < 2}
                        required
                    />
                </div>
            ) : null}
            <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-foreground/80 text-xs font-semibold">
                    Mot de passe
                </Label>
                <Input
                    id="password"
                    type="password"
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    placeholder={isSignup ? '8 caractères minimum' : 'Ton mot de passe'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={error !== null && password.length < 1}
                    required
                />
            </div>
            {error ? (
                <p className="text-destructive text-xs" role="alert">
                    {error}
                </p>
            ) : null}
            <Button
                type="submit"
                disabled={isPending}
                className="bg-foreground text-background hover:bg-foreground/90 h-11 w-full rounded-full text-sm font-semibold"
            >
                {isPending ? 'Un instant…' : 'Continuer'}
            </Button>
            <p className="text-muted-foreground text-center text-[11px]">
                {isSignup ? 'En continuant, tu crées un compte LUMIRIS.' : 'Connecte-toi à ton compte LUMIRIS.'}
            </p>
        </form>
    );
}

export default function SignInPage() {
    return (
        <div className="relative flex h-full flex-col px-6 pb-10 pt-12">
            <IridescentBackground intensity="subtle" />

            <Link
                href="/auth"
                className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1 text-xs"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Retour
            </Link>

            <motion.div
                className="mt-8 flex flex-1 flex-col items-center justify-center"
                variants={slideUpFade}
                initial="initial"
                animate="animate"
            >
                <GlassCard className="w-full max-w-sm p-7">
                    <h1 className="text-foreground text-xl font-bold tracking-tight">Bienvenue</h1>
                    <div className="mt-6">
                        <Suspense fallback={<p className="text-muted-foreground text-xs">Chargement…</p>}>
                            <SignInForm />
                        </Suspense>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
}
