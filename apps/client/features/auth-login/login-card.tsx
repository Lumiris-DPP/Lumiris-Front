'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import { Card } from '@lumiris/ui/components/card';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { useLoginForm } from './use-login-form';

const PLACEHOLDER_EMAIL = 'artisan@lumiris.com';

/** The login card. Owns its form state via {@link useLoginForm}. */
export function LoginCard() {
    const form = useLoginForm();

    return (
        <>
            <Card className="bg-card rounded-2xl px-7 py-8 shadow-xl">
                <header className="flex flex-col items-center text-center">
                    <div className="bg-lumiris-emerald flex h-12 w-12 items-center justify-center rounded-xl">
                        <Sparkles className="text-primary-foreground h-5 w-5" />
                    </div>
                    <h1 className="text-foreground mt-4 text-xl font-semibold tracking-tight">LUMIRIS</h1>
                    <p className="text-muted-foreground mt-1 text-xs">ATELIER · l&apos;outil des artisans textile</p>
                </header>

                <form onSubmit={form.submit} className="mt-7 flex flex-col gap-4" noValidate>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="email" className="text-foreground/80 text-xs font-semibold">
                            Adresse e-mail
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            ref={form.emailInputRef}
                            autoComplete="email"
                            inputMode="email"
                            aria-label="Adresse e-mail"
                            aria-invalid={form.errors.email ? true : undefined}
                            placeholder={PLACEHOLDER_EMAIL}
                            value={form.email}
                            onChange={(e) => form.setEmail(e.target.value)}
                        />
                        {form.errors.email ? (
                            <p className="text-destructive text-xs" role="alert">
                                {form.errors.email}
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
                            aria-invalid={form.errors.password ? true : undefined}
                            placeholder="••••••••"
                            value={form.password}
                            onChange={(e) => form.setPassword(e.target.value)}
                        />
                        {form.errors.password ? (
                            <p className="text-destructive text-xs" role="alert">
                                {form.errors.password}
                            </p>
                        ) : null}
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={form.forgot}
                            className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
                        >
                            Mot de passe oublié ?
                        </button>
                    </div>

                    <Button
                        type="submit"
                        disabled={form.isPending}
                        className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 mt-1 h-10 w-full text-white"
                    >
                        {form.isPending ? 'Connexion…' : 'Se connecter'}
                    </Button>

                    <p className="text-muted-foreground text-center text-[11px]">
                        Pas encore de compte ?{' '}
                        <Link href="/register" className="text-lumiris-emerald hover:underline">
                            Créer un compte
                        </Link>
                    </p>
                </form>
            </Card>
        </>
    );
}
