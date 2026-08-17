'use client';

import { useState, type SyntheticEvent } from 'react';
import { ChevronLeft } from 'lucide-react';
import { z } from 'zod';
import type { UserRole } from '@lumiris/types';
import { useRegister } from '@lumiris/api-client/react';
import { Button } from '@lumiris/ui/components/button';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { toast } from '@lumiris/ui/components/sonner';
import { signInWithToken } from '@/lib/auth-store';
import { zodFieldErrors } from '@/lib/form-errors';

const CredentialsSchema = z
    .object({
        name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
        email: z.string().email('Adresse e-mail invalide'),
        password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
        confirm: z.string(),
    })
    .refine((data) => data.password === data.confirm, {
        message: 'Les mots de passe ne correspondent pas',
        path: ['confirm'],
    });

type FieldErrors = Partial<Record<'name' | 'email' | 'password' | 'confirm', string>>;

const ROLE_LABEL: Record<UserRole, string> = {
    artisan: 'Artisan',
    consumer: 'Consommateur',
    repairer: 'Réparateur',
    admin: 'Administrateur',
};

interface StepCredentialsProps {
    role: UserRole;
    onBack: () => void;
    onSuccess: (name: string) => void;
}

export function StepCredentials({ role, onBack, onSuccess }: StepCredentialsProps) {
    const registerMutation = useRegister();
    const [fields, setFields] = useState({ name: '', email: '', password: '', confirm: '' });
    const [errors, setErrors] = useState<FieldErrors>({});

    function setField(key: keyof typeof fields, value: string) {
        setFields((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    }

    async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        const parsed = CredentialsSchema.safeParse(fields);
        if (!parsed.success) {
            setErrors(zodFieldErrors<typeof fields>(parsed.error));
            return;
        }

        try {
            const { token, refreshToken, user } = await registerMutation.mutateAsync({
                email: parsed.data.email.trim().toLowerCase(),
                password: parsed.data.password,
                name: parsed.data.name.trim(),
                role,
            });
            signInWithToken(user.id, user.artisanId ?? null, user.role, token, refreshToken, user.name ?? null);
            onSuccess(user.name ?? parsed.data.name);
        } catch (err: unknown) {
            const status = (err as { status?: number })?.status;
            if (status === 409) {
                setErrors({ email: 'Un compte existe déjà avec cet e-mail' });
            } else {
                toast.error('Erreur lors de la création du compte. Veuillez réessayer.');
            }
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <button
                    type="button"
                    onClick={onBack}
                    className="mb-4 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Retour
                </button>
                <h2 className="text-lg font-semibold text-foreground">Vos informations</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Compte <span className="font-medium">{ROLE_LABEL[role]}</span>
                </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="reg-name" className="text-xs font-semibold text-foreground/80">
                        Nom complet
                    </Label>
                    <Input
                        id="reg-name"
                        name="name"
                        type="text"
                        required
                        autoComplete="name"
                        placeholder="Marie Dupont"
                        value={fields.name}
                        onChange={(e) => setField('name', e.target.value)}
                        aria-invalid={errors.name ? true : undefined}
                    />
                    {errors.name && (
                        <p className="text-xs text-destructive" role="alert">
                            {errors.name}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="reg-email" className="text-xs font-semibold text-foreground/80">
                        Adresse e-mail
                    </Label>
                    <Input
                        id="reg-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        inputMode="email"
                        placeholder="marie@atelier.fr"
                        value={fields.email}
                        onChange={(e) => setField('email', e.target.value)}
                        aria-invalid={errors.email ? true : undefined}
                    />
                    {errors.email && (
                        <p className="text-xs text-destructive" role="alert">
                            {errors.email}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="reg-password" className="text-xs font-semibold text-foreground/80">
                        Mot de passe
                    </Label>
                    <Input
                        id="reg-password"
                        name="new-password"
                        type="password"
                        required
                        autoComplete="new-password"
                        placeholder="8 caractères minimum"
                        value={fields.password}
                        onChange={(e) => setField('password', e.target.value)}
                        aria-invalid={errors.password ? true : undefined}
                    />
                    {errors.password && (
                        <p className="text-xs text-destructive" role="alert">
                            {errors.password}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="reg-confirm" className="text-xs font-semibold text-foreground/80">
                        Confirmer le mot de passe
                    </Label>
                    <Input
                        id="reg-confirm"
                        name="confirm-password"
                        type="password"
                        required
                        autoComplete="new-password"
                        placeholder="Répétez votre mot de passe"
                        value={fields.confirm}
                        onChange={(e) => setField('confirm', e.target.value)}
                        aria-invalid={errors.confirm ? true : undefined}
                    />
                    {errors.confirm && (
                        <p className="text-xs text-destructive" role="alert">
                            {errors.confirm}
                        </p>
                    )}
                </div>

                <Button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="mt-1 h-10 w-full bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90"
                >
                    {registerMutation.isPending ? 'Création…' : 'Créer mon compte'}
                </Button>
            </form>
        </div>
    );
}
