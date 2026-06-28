'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { toast } from '@lumiris/ui/components/sonner';
import { useLogin } from '@lumiris/api-client/react';
import { signIn, signInWithToken } from '@/lib/auth-store';
import { zodFieldErrors } from '@/lib/form-errors';
import { findArtisanByEmail } from '@/lib/mock-auth';

const LoginSchema = z.object({
    email: z.string().email('Adresse e-mail invalide'),
    password: z.string().min(1, 'Mot de passe requis'),
});

type LoginFields = z.infer<typeof LoginSchema>;
type LoginErrors = Partial<Record<keyof LoginFields, string>>;

/**
 * Owns the login form: field state, validation, and the demo-vs-API sign-in
 * branch. Keeps the page itself a thin layout.
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

        // Demo mode: email matches a mock artisan → no API call.
        const demoArtisan = findArtisanByEmail(normalizedEmail);
        if (demoArtisan) {
            signIn(demoArtisan.id);
            const firstName = demoArtisan.displayName.split(' ')[0] ?? demoArtisan.displayName;
            toast.success(`Bienvenue ${firstName}`, { description: demoArtisan.atelierName });
            router.push('/dashboard');
            return;
        }

        // Real mode: call the API.
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

    function pickDemo(demoEmail: string) {
        setEmail(demoEmail);
        setErrors((prev) => ({ ...prev, email: undefined }));
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
        pickDemo,
    };
}
