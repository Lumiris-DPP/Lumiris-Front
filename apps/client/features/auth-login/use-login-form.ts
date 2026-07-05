'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { toast } from '@lumiris/ui/components/sonner';
import { useLogin } from '@lumiris/api-client/react';
import { signInWithToken } from '@/lib/auth-store';
import { zodFieldErrors } from '@/lib/form-errors';

const LoginSchema = z.object({
    email: z.string().email('Adresse e-mail invalide'),
    password: z.string().min(1, 'Mot de passe requis'),
});

type LoginFields = z.infer<typeof LoginSchema>;
type LoginErrors = Partial<Record<keyof LoginFields, string>>;

/**
 * Owns the login form: field state, validation, and the API sign-in.
 * Authenticates against the real backend (`POST /api/auth/login`) via
 * `@lumiris/api-client` — no demo/mock shortcut. Keeps the page a thin layout.
 */
export function useLoginForm() {
    const router = useRouter();
    const loginMutation = useLogin();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<LoginErrors>({});
    const emailInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        emailInputRef.current?.focus();
    }, []);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const parsed = LoginSchema.safeParse({ email, password });
        if (!parsed.success) {
            setErrors(zodFieldErrors<LoginFields>(parsed.error));
            return;
        }
        setErrors({});
        const normalizedEmail = parsed.data.email.trim().toLowerCase();

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

    function forgot() {
        toast.info('Fonctionnalité non disponible pour le moment');
    }

    return {
        email,
        setEmail,
        password,
        setPassword,
        errors,
        emailInputRef,
        isPending: loginMutation.isPending,
        submit,
        forgot,
    };
}
