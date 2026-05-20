'use client';

import { useState, useCallback, type FormEvent, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { CameraOff, RefreshCw, ScanSearch, KeyRound } from 'lucide-react';
import { GlassCard, IridescentBackground, SPRING_OVERLAY } from '@/lib/motion';

interface CameraDeniedStateProps {
    onRetry: () => void;
    onManualEntry: () => void;
}

export function CameraDeniedState({ onRetry, onManualEntry }: CameraDeniedStateProps) {
    return (
        <EmptyShell icon={<CameraOff className="text-lumiris-rose h-7 w-7" />} title="Caméra non disponible">
            <p>
                Pour scanner un passeport, autorise l&apos;accès à ta caméra dans les réglages du navigateur, puis
                réessaie.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
                <PrimaryButton onClick={onRetry} icon={<RefreshCw className="h-3.5 w-3.5" />} label="Réessayer" />
                <SecondaryButton
                    onClick={onManualEntry}
                    icon={<KeyRound className="h-3.5 w-3.5" />}
                    label="Saisir un identifiant"
                />
            </div>
        </EmptyShell>
    );
}

interface QrUnreadableStateProps {
    onRetry: () => void;
    onManualEntry: () => void;
}

export function QrUnreadableState({ onRetry, onManualEntry }: QrUnreadableStateProps) {
    return (
        <EmptyShell icon={<ScanSearch className="text-lumiris-amber h-7 w-7" />} title="QR illisible">
            <p>Approche un peu plus, vérifie l&apos;éclairage ou stabilise la pièce.</p>
            <div className="flex flex-col gap-2 sm:flex-row">
                <PrimaryButton onClick={onRetry} icon={<RefreshCw className="h-3.5 w-3.5" />} label="Recommencer" />
                <SecondaryButton
                    onClick={onManualEntry}
                    icon={<KeyRound className="h-3.5 w-3.5" />}
                    label="Saisir un identifiant"
                />
            </div>
        </EmptyShell>
    );
}

interface PassportNotFoundStateProps {
    raw: string;
    onRetry: () => void;
    onSubmitManualId: (id: string) => void;
}

export function PassportNotFoundState({ raw, onRetry, onSubmitManualId }: PassportNotFoundStateProps) {
    const [value, setValue] = useState('');
    const handle = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const trimmed = value.trim();
            if (trimmed) onSubmitManualId(trimmed);
        },
        [value, onSubmitManualId],
    );
    return (
        <EmptyShell icon={<ScanSearch className="text-lumiris-orange h-7 w-7" />} title="Aucun DPP reconnu">
            <p>
                Le code lu (<span className="text-foreground/80 font-mono text-[10px]">{raw.slice(0, 32)}</span>)
                n&apos;est pas un passeport ESPR valide. Saisis un identifiant manuel ou recommence.
            </p>
            <form onSubmit={handle} className="flex w-full max-w-xs flex-col gap-2">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="ex. pass-marie-001"
                    className="border-border bg-card/80 text-foreground placeholder:text-muted-foreground/60 rounded-xl border px-3 py-2.5 text-sm backdrop-blur-md"
                    aria-label="Identifiant passeport"
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                        type="submit"
                        disabled={!value.trim()}
                        className="bg-foreground text-primary-foreground flex-1 rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-50"
                    >
                        Ouvrir
                    </button>
                    <SecondaryButton
                        onClick={onRetry}
                        icon={<RefreshCw className="h-3.5 w-3.5" />}
                        label="Recommencer"
                    />
                </div>
            </form>
        </EmptyShell>
    );
}

function PrimaryButton({ onClick, icon, label }: { onClick: () => void; icon: ReactNode; label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="bg-foreground text-primary-foreground inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
        >
            {icon}
            {label}
        </button>
    );
}

function SecondaryButton({ onClick, icon, label }: { onClick: () => void; icon: ReactNode; label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="border-border/60 bg-card/70 text-foreground inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-xs font-medium backdrop-blur-md"
        >
            {icon}
            {label}
        </button>
    );
}

function EmptyShell({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
    return (
        <motion.div
            className="bg-background/80 absolute inset-0 z-30 flex items-center justify-center px-6 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
        >
            <IridescentBackground />
            <motion.div initial={{ y: 12, scale: 0.97 }} animate={{ y: 0, scale: 1 }} transition={SPRING_OVERLAY}>
                <GlassCard
                    intensity="strong"
                    className="flex w-full max-w-sm flex-col items-center gap-3 p-6 text-center"
                >
                    <div className="border-border bg-card flex h-14 w-14 items-center justify-center rounded-2xl border">
                        {icon}
                    </div>
                    <h2 className="text-foreground text-base font-semibold">{title}</h2>
                    <div className="text-muted-foreground flex flex-col items-center gap-3 text-xs leading-relaxed">
                        {children}
                    </div>
                </GlassCard>
            </motion.div>
        </motion.div>
    );
}
