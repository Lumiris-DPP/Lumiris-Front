'use client';

import Link from 'next/link';
import { Button } from '@lumiris/ui/components/button';
import { LumirisLogo } from '@lumiris/ui/components/logo';
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
            <Card className="rounded-2xl bg-card px-7 py-8 shadow-xl">
                <header className="flex flex-col items-center text-center">
                    <LumirisLogo className="h-12 w-auto" />
                    <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">LUMIRIS</h1>
                    <p className="mt-1 text-xs text-muted-foreground">ATELIER · l&apos;outil des artisans textile</p>
                </header>

                <form onSubmit={form.submit} className="mt-7 flex flex-col gap-4" noValidate>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="email" className="text-xs font-semibold text-foreground/80">
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
                            <p className="text-xs text-destructive" role="alert">
                                {form.errors.email}
                            </p>
                        ) : null}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="password" className="text-xs font-semibold text-foreground/80">
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
                            <p className="text-xs text-destructive" role="alert">
                                {form.errors.password}
                            </p>
                        ) : null}
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={form.forgot}
                            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        >
                            Mot de passe oublié ?
                        </button>
                    </div>

                    <Button
                        type="submit"
                        disabled={form.isPending}
                        className="mt-1 h-10 w-full bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90"
                    >
                        {form.isPending ? 'Connexion…' : 'Se connecter'}
                    </Button>

                    <p className="text-center text-[11px] text-muted-foreground">
                        Pas encore de compte ?{' '}
                        <Link href="/register" className="text-lumiris-cyan hover:underline">
                            Créer un compte
                        </Link>
                    </p>
                </form>
            </Card>
        </>
    );
}
