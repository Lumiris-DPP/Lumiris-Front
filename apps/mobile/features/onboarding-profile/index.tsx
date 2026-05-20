'use client';

import { useId, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@lumiris/ui/components/button';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { mockRepairers } from '@lumiris/mock-data';
import { GlassCard, IridescentBackground, slideUpFade } from '@/lib/motion';
import { useUser } from '@/lib/auth';

const STYLE_OPTIONS: readonly string[] = ['Casual', 'Formel', 'Streetwear', 'Vintage', 'Sport', 'Workwear'];
const MAX_STYLE_PREFS = 3;

export function OnboardingProfile() {
    const router = useRouter();
    const { user, isAuthenticated, updateUser } = useUser();
    const cityId = useId();
    const datalistId = useId();

    const cities = useMemo(() => {
        const set = new Set<string>();
        for (const r of mockRepairers) set.add(r.city);
        return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
    }, []);

    const [city, setCity] = useState(user?.city ?? '');
    const [stylePrefs, setStylePrefs] = useState<readonly string[]>(user?.stylePrefs ?? []);

    function toggleStyle(value: string): void {
        setStylePrefs((current) => {
            if (current.includes(value)) return current.filter((v) => v !== value);
            if (current.length >= MAX_STYLE_PREFS) return current;
            return [...current, value];
        });
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        const trimmed = city.trim();
        updateUser({
            city: trimmed.length > 0 ? trimmed : undefined,
            stylePrefs: stylePrefs.length > 0 ? [...stylePrefs] : undefined,
        });
        router.push('/');
    }

    function handleSkip(): void {
        router.push('/');
    }

    if (!isAuthenticated) {
        router.replace('/auth');
        return null;
    }

    const remaining = MAX_STYLE_PREFS - stylePrefs.length;

    return (
        <div className="relative flex h-full flex-col px-6 pb-10 pt-[max(env(safe-area-inset-top),3rem)]">
            <IridescentBackground intensity="subtle" />

            <header className="flex items-center justify-end">
                <button
                    type="button"
                    onClick={handleSkip}
                    className="text-muted-foreground hover:text-foreground rounded-full px-3 py-1 text-xs font-medium transition-colors"
                >
                    Passer
                </button>
            </header>

            <motion.div
                className="mt-6 flex flex-1 flex-col items-center justify-center"
                variants={slideUpFade}
                initial="initial"
                animate="animate"
            >
                <GlassCard className="w-full max-w-sm p-7">
                    <header className="text-center">
                        <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.28em]">
                            Profil
                        </p>
                        <h1 className="text-foreground mt-2 text-xl font-bold tracking-tight">
                            Aide-nous à personnaliser
                        </h1>
                        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                            Ta ville sert à proposer les bons retoucheurs. Le style affine les suggestions.
                        </p>
                    </header>

                    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor={cityId} className="text-foreground/80 text-xs font-semibold">
                                Ville
                            </Label>
                            <Input
                                id={cityId}
                                list={datalistId}
                                type="text"
                                autoComplete="address-level2"
                                placeholder="Lyon, Marseille…"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                            />
                            <datalist id={datalistId}>
                                {cities.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </datalist>
                        </div>

                        <fieldset className="flex flex-col gap-2">
                            <legend className="text-foreground/80 text-xs font-semibold">
                                Style préféré
                                <span className="text-muted-foreground ml-2 font-normal">
                                    ({remaining > 0 ? `${remaining} restant${remaining > 1 ? 's' : ''}` : 'max atteint'}
                                    )
                                </span>
                            </legend>
                            <div className="flex flex-wrap gap-2">
                                {STYLE_OPTIONS.map((opt) => {
                                    const selected = stylePrefs.includes(opt);
                                    const disabled = !selected && stylePrefs.length >= MAX_STYLE_PREFS;
                                    return (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => toggleStyle(opt)}
                                            aria-pressed={selected}
                                            disabled={disabled}
                                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                                                selected
                                                    ? 'border-foreground bg-foreground text-background'
                                                    : 'border-border/60 bg-background/60 text-foreground/80 hover:bg-foreground/5'
                                            }`}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        </fieldset>

                        <Button
                            type="submit"
                            className="bg-foreground text-background hover:bg-foreground/90 mt-2 h-11 w-full rounded-full text-sm font-semibold"
                        >
                            Terminer
                        </Button>
                    </form>
                </GlassCard>
            </motion.div>
        </div>
    );
}
