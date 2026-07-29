'use client';

import { CameraOff, ScanLine, FileQuestion } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

type LucideIcon = ComponentType<SVGProps<SVGSVGElement>>;

interface EmptyShellProps {
    Icon: LucideIcon;
    title: string;
    message: string;
    primary: { label: string; onClick: () => void };
    secondary?: { label: string; onClick: () => void };
}

function EmptyShell({ Icon, title, message, primary, secondary }: EmptyShellProps) {
    return (
        <div
            role="alert"
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-background px-8 text-center"
        >
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-foreground">
                <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden />
            </span>
            <div className="flex flex-col gap-1.5">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
                <p className="mx-auto max-w-xs text-sm leading-relaxed text-pretty text-muted-foreground">{message}</p>
            </div>
            <div className="flex w-full max-w-xs flex-col gap-2">
                <button
                    type="button"
                    onClick={primary.onClick}
                    className="inline-flex h-14 w-full items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background active:scale-[0.98]"
                >
                    {primary.label}
                </button>
                {secondary ? (
                    <button
                        type="button"
                        onClick={secondary.onClick}
                        className="inline-flex h-11 w-full items-center justify-center text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                        {secondary.label}
                    </button>
                ) : null}
            </div>
        </div>
    );
}

interface CameraDeniedStateProps {
    onAllow: () => void;
    onManualEntry: () => void;
}

export function CameraDeniedState({ onAllow, onManualEntry }: CameraDeniedStateProps) {
    return (
        <EmptyShell
            Icon={CameraOff}
            title="Caméra non disponible"
            message="Autorise l'accès à la caméra pour scanner un QR code, ou saisis le code à la main."
            primary={{ label: 'Autoriser la caméra', onClick: onAllow }}
            secondary={{ label: 'Saisir un code à la main', onClick: onManualEntry }}
        />
    );
}

interface QrUnreadableStateProps {
    onRetry: () => void;
    onManualEntry: () => void;
}

export function QrUnreadableState({ onRetry, onManualEntry }: QrUnreadableStateProps) {
    return (
        <EmptyShell
            Icon={ScanLine}
            title="QR illisible"
            message="Rapproche-toi du QR code et assure-toi d'avoir assez de lumière."
            primary={{ label: 'Réessayer', onClick: onRetry }}
            secondary={{ label: 'Saisir un code à la main', onClick: onManualEntry }}
        />
    );
}

interface NonLumirisQrStateProps {
    onRetry: () => void;
    onManualEntry: () => void;
}

export function NonLumirisQrState({ onRetry, onManualEntry }: NonLumirisQrStateProps) {
    return (
        <EmptyShell
            Icon={FileQuestion}
            title="Passeport introuvable"
            message="Ce QR code ne pointe pas vers un passeport Lumiris connu."
            primary={{ label: 'Saisir un code à la main', onClick: onManualEntry }}
            secondary={{ label: 'Réessayer', onClick: onRetry }}
        />
    );
}
