'use client';

import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { GlassCard } from '@/lib/motion';

interface PermissionPromptProps {
    onAccept: () => void;
    onDismiss: () => void;
}

export function PermissionPrompt({ onAccept, onDismiss }: PermissionPromptProps) {
    return (
        <motion.div
            role="dialog"
            aria-labelledby="geoloc-prompt-title"
            aria-describedby="geoloc-prompt-desc"
            className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-background/80 px-8 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
        >
            <GlassCard className="flex w-full max-w-sm flex-col items-center gap-5 p-7 text-center">
                <span
                    aria-hidden
                    className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-background/60"
                >
                    <MapPin className="h-6 w-6 text-foreground/80" />
                    <span className="absolute -inset-2 -z-10 rounded-3xl bg-lumiris-cyan/15 blur-xl motion-reduce:hidden" />
                </span>

                <div className="flex flex-col gap-2">
                    <h2 id="geoloc-prompt-title" className="text-lg font-bold tracking-tight text-foreground">
                        Active ta position
                    </h2>
                    <p id="geoloc-prompt-desc" className="text-sm leading-relaxed text-muted-foreground">
                        LUMIRIS te montre les ateliers et retoucheurs partenaires les plus proches de toi. Ta position
                        reste sur ton telephone.
                    </p>
                </div>

                <div className="mt-1 flex w-full flex-col gap-2">
                    <button
                        type="button"
                        onClick={onAccept}
                        className="inline-flex h-11 w-full items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background hover:bg-foreground/90"
                    >
                        Activer la position
                    </button>
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="inline-flex h-11 w-full items-center justify-center rounded-full text-sm text-muted-foreground hover:text-foreground"
                    >
                        Plus tard
                    </button>
                </div>
            </GlassCard>
        </motion.div>
    );
}
