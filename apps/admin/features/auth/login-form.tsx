'use client';

import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import { Checkbox } from '@lumiris/ui/components/checkbox';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { cn } from '@lumiris/ui/lib/cn';
import { auth, useSession, type SignInError } from '@/lib/auth';

const ERROR_LABELS: Record<SignInError, string> = {
    invalid_credentials: 'Identifiants invalides.',
    unknown_email: 'Aucun compte trouvé pour cet email.',
    not_admin: "Ce compte n'a pas les droits d'administration.",
};

function isSafeNext(value: string | null): value is string {
    return Boolean(value && value.startsWith('/') && !value.startsWith('//'));
}

export function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const session = useSession();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<SignInError | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const emailRef = useRef<HTMLInputElement>(null);

    const nextParam = searchParams?.get('next') ?? null;
    const redirectTo = isSafeNext(nextParam) ? nextParam : '/cockpit';

    useEffect(() => {
        if (session) router.replace(redirectTo);
    }, [session, redirectTo, router]);

    useEffect(() => {
        emailRef.current?.focus();
    }, []);

    const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (submitting) return;
        setError(null);
        setSubmitting(true);

        const result = await auth.signIn(email, password, rememberMe);

        if (!result.ok) {
            setError(result.error);
            setSubmitting(false);
            return;
        }

        router.replace(redirectTo);
    };

    return (
        <form
            onSubmit={handleSubmit}
            noValidate
            className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-8"
        >
            <div>
                <h1 className="text-lg font-semibold text-foreground">Connexion</h1>
            </div>

            <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                    ref={emailRef}
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    aria-invalid={error === 'unknown_email' ? true : undefined}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="login-password">Mot de passe</Label>
                <div className="relative">
                    <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        aria-invalid={error === 'invalid_credentials' ? true : undefined}
                        className="pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    >
                        {showPassword ? (
                            <EyeOff className="h-4 w-4" aria-hidden />
                        ) : (
                            <Eye className="h-4 w-4" aria-hidden />
                        )}
                    </button>
                </div>
            </div>

            <Label className="gap-2 text-sm font-normal text-muted-foreground">
                <Checkbox checked={rememberMe} onCheckedChange={(value) => setRememberMe(value === true)} />
                Se souvenir 7 jours
            </Label>

            <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Connexion…
                    </>
                ) : (
                    'Se connecter'
                )}
            </Button>

            <div
                role="alert"
                aria-live="polite"
                className={cn('text-sm text-lumiris-rose', error ? 'opacity-100' : 'sr-only opacity-0')}
            >
                {error ? ERROR_LABELS[error] : null}
            </div>
        </form>
    );
}
