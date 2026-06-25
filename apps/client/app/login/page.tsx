'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { z } from 'zod';
import { mockArtisans } from '@lumiris/mock-data';
import { Button } from '@lumiris/ui/components/button';
import { Card } from '@lumiris/ui/components/card';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Popover, PopoverContent, PopoverTrigger } from '@lumiris/ui/components/popover';
import { toast } from '@lumiris/ui/components/sonner';
import { cn } from '@lumiris/ui/lib/cn';
import { useLogin } from '@lumiris/api-client/react';
import { signIn, signInWithToken } from '@/lib/auth-store';
import { ESPR_TEXTILE_TIMELINE } from '@/lib/regulatory';
import { useAuthArtisanId, useAuthHydrated } from '@/lib/use-auth';
import { DEMO_CREDENTIALS, findArtisanByEmail, MOCK_PASSWORD } from '@/lib/mock-auth';

const LoginSchema = z.object({
    email: z.string().email('Adresse e-mail invalide'),
    password: z.string().min(1, 'Mot de passe requis'),
});

type FieldErrors = Partial<Record<'email' | 'password', string>>;

const TIER_BADGE: Record<'Solo' | 'Studio' | 'Maison', string> = {
    Solo: 'bg-tier-solo/15 text-tier-solo',
    Studio: 'bg-tier-studio/15 text-tier-studio',
    Maison: 'bg-tier-maison/15 text-tier-maison',
};

export default function LoginPage() {
    const router = useRouter();
    const hydrated = useAuthHydrated();
    const artisanId = useAuthArtisanId();
    const loginMutation = useLogin();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<FieldErrors>({});
    const emailInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (hydrated && artisanId) {
            router.replace('/dashboard');
        }
    }, [hydrated, artisanId, router]);

    useEffect(() => {
        if (hydrated && !artisanId) {
            emailInputRef.current?.focus();
        }
    }, [hydrated, artisanId]);

    const placeholderEmail = useMemo(() => DEMO_CREDENTIALS[0]?.email ?? 'prenom.nom@atelier.fr', []);

    if (!hydrated || artisanId) return null;

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const parsed = LoginSchema.safeParse({ email, password });
        if (!parsed.success) {
            const next: FieldErrors = {};
            for (const issue of parsed.error.issues) {
                const key = issue.path[0];
                if (key === 'email' || key === 'password') next[key] = issue.message;
            }
            setErrors(next);
            return;
        }

        setErrors({});
        const normalizedEmail = parsed.data.email.trim().toLowerCase();

        // Demo mode: email matches a mock artisan → no API call
        const demoArtisan = findArtisanByEmail(normalizedEmail);
        if (demoArtisan) {
            signIn(demoArtisan.id);
            const firstName = demoArtisan.displayName.split(' ')[0] ?? demoArtisan.displayName;
            toast.success(`Bienvenue ${firstName}`, { description: demoArtisan.atelierName });
            router.push('/dashboard');
            return;
        }

        // Real mode: call the API
        try {
            const { token, user } = await loginMutation.mutateAsync({
                email: normalizedEmail,
                password: parsed.data.password,
            });
            const artisanProfileId = 'artisanId' in user ? ((user.artisanId as string | undefined) ?? null) : null;
            signInWithToken(artisanProfileId, token, user.name ?? null);
            const firstName = user.name?.split(' ')[0] ?? 'vous';
            toast.success(`Bienvenue ${firstName}`);
            router.push('/dashboard');
        } catch {
            toast.error('Email ou mot de passe incorrect');
        }
    }

    function handleForgot() {
        toast.info('Fonctionnalité non disponible pour le moment');
    }

    function handlePickDemo(demoEmail: string) {
        setEmail(demoEmail);
        setErrors((prev) => ({ ...prev, email: undefined }));
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

            <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-12">
                <Card className="bg-card rounded-2xl px-7 py-8 shadow-xl">
                    <header className="flex flex-col items-center text-center">
                        <div className="bg-lumiris-emerald flex h-12 w-12 items-center justify-center rounded-xl">
                            <Sparkles className="text-primary-foreground h-5 w-5" />
                        </div>
                        <h1 className="text-foreground mt-4 text-xl font-semibold tracking-tight">LUMIRIS</h1>
                        <p className="text-muted-foreground mt-1 text-xs">
                            ATELIER · l&apos;outil des artisans textile
                        </p>
                    </header>

                    <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4" noValidate>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="email" className="text-foreground/80 text-xs font-semibold">
                                Adresse e-mail
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                ref={emailInputRef}
                                autoComplete="email"
                                inputMode="email"
                                aria-label="Adresse e-mail"
                                aria-invalid={errors.email ? true : undefined}
                                placeholder={placeholderEmail}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            {errors.email ? (
                                <p className="text-destructive text-xs" role="alert">
                                    {errors.email}
                                </p>
                            ) : null}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="password" className="text-foreground/80 text-xs font-semibold">
                                Mot de passe
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                aria-label="Mot de passe"
                                aria-invalid={errors.password ? true : undefined}
                                placeholder={MOCK_PASSWORD}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {errors.password ? (
                                <p className="text-destructive text-xs" role="alert">
                                    {errors.password}
                                </p>
                            ) : null}
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleForgot}
                                className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
                            >
                                Mot de passe oublié ?
                            </button>
                        </div>

                        <Button
                            type="submit"
                            disabled={loginMutation.isPending}
                            className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 mt-1 h-10 w-full text-white"
                        >
                            {loginMutation.isPending ? 'Connexion…' : 'Se connecter'}
                        </Button>

                        <p className="text-muted-foreground text-center text-[11px]">
                            Pas encore de compte ?{' '}
                            <Link href="/register" className="text-lumiris-emerald hover:underline">
                                Créer un compte
                            </Link>
                        </p>
                    </form>
                </Card>

                <details className="text-muted-foreground group mt-6 text-xs">
                    <summary className="hover:text-foreground cursor-pointer list-none text-center underline-offset-4 hover:underline">
                        Tester un atelier démo · password = «{MOCK_PASSWORD}»
                    </summary>
                    <ul className="border-border bg-card/60 mt-3 divide-y rounded-lg border">
                        {DEMO_CREDENTIALS.map(({ artisan, email: demoEmail }) => (
                            <li key={artisan.id}>
                                <button
                                    type="button"
                                    onClick={() => handlePickDemo(demoEmail)}
                                    className="hover:bg-accent/40 focus-visible:bg-accent/40 flex w-full items-center gap-3 px-3 py-2 text-left transition-colors focus-visible:outline-none"
                                    aria-label={`Pré-remplir l'e-mail de ${artisan.displayName}`}
                                >
                                    <Image
                                        src={artisan.photoUrl}
                                        alt=""
                                        width={32}
                                        height={32}
                                        className="bg-muted h-8 w-8 shrink-0 rounded-full object-cover"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-foreground truncate text-xs font-medium">
                                                {artisan.displayName}
                                            </span>
                                            <span
                                                className={cn(
                                                    'shrink-0 rounded px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-wider',
                                                    TIER_BADGE[artisan.tier],
                                                )}
                                            >
                                                {artisan.tier}
                                            </span>
                                        </div>
                                        <p className="text-muted-foreground/90 truncate font-mono text-[11px]">
                                            {demoEmail}
                                        </p>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </details>

                <Popover>
                    <PopoverTrigger className="text-muted-foreground hover:text-foreground mx-auto mt-8 flex items-center gap-1.5 text-xs transition-colors focus:outline-none">
                        <ShieldCheck className="text-lumiris-emerald h-3.5 w-3.5" />
                        Conforme ESPR · acte délégué textile attendu 2027 · application mi-2028
                    </PopoverTrigger>
                    <PopoverContent align="center" className="w-80">
                        <p className="text-foreground text-sm font-medium">Calendrier ESPR textile</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                            LUMIRIS anticipe l&apos;obligation européenne de Passeport Numérique Produit.
                        </p>
                        <ol className="mt-3 space-y-2.5">
                            {ESPR_TEXTILE_TIMELINE.map((milestone) => (
                                <li key={milestone.date} className="flex gap-3">
                                    <span className="text-lumiris-emerald shrink-0 font-mono text-xs font-semibold">
                                        {milestone.date}
                                    </span>
                                    <span className="text-foreground text-xs leading-relaxed">{milestone.label}</span>
                                </li>
                            ))}
                        </ol>
                    </PopoverContent>
                </Popover>
            </main>
        </div>
    );
}
