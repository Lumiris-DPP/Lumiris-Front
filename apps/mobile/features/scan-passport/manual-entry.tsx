'use client';

import { useState, useCallback, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { GlassCard, IridescentBackground, SPRING_OVERLAY } from '@/lib/motion';

export function ManualEntry() {
    const router = useRouter();
    const [value, setValue] = useState('');

    const submit = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const trimmed = value.trim();
            if (trimmed) router.push(`/passeport/${trimmed}`);
        },
        [router, value],
    );

    return (
        <div className="bg-background relative flex h-full w-full flex-col overflow-hidden">
            <IridescentBackground />

            <header className="flex items-center gap-3 px-5 pb-3 pt-12">
                <button
                    type="button"
                    onClick={() => router.back()}
                    aria-label="Retour"
                    className="border-border/60 bg-card/80 text-foreground inline-flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                    <h1 className="text-foreground text-base font-bold tracking-tight">Saisie manuelle</h1>
                    <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.2em]">
                        ID passeport
                    </p>
                </div>
            </header>

            <main className="flex flex-1 flex-col justify-center px-6 pb-20">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={SPRING_OVERLAY}>
                    <GlassCard intensity="strong" className="p-6">
                        <form onSubmit={submit} className="flex flex-col gap-4">
                            <label htmlFor="manual-id" className="flex flex-col gap-2">
                                <span className="text-foreground text-sm font-semibold">Identifiant du passeport</span>
                                <input
                                    id="manual-id"
                                    type="text"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder="ex. pass-marie-001"
                                    autoComplete="off"
                                    autoCapitalize="off"
                                    spellCheck={false}
                                    className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-foreground rounded-xl border px-3 py-3 font-mono text-sm outline-none transition"
                                    aria-label="Identifiant du passeport"
                                    aria-describedby="manual-id-hint"
                                />
                            </label>

                            <p
                                id="manual-id-hint"
                                className="text-muted-foreground flex items-start gap-2 text-xs leading-relaxed"
                            >
                                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                                Tu peux trouver l&apos;identifiant au dos de l&apos;étiquette LUMIRIS, sous le QR code.
                            </p>

                            <button
                                type="submit"
                                disabled={!value.trim()}
                                className="bg-foreground text-primary-foreground inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold disabled:opacity-50"
                            >
                                Ouvrir le passeport
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </form>
                    </GlassCard>
                </motion.div>
            </main>
        </div>
    );
}
