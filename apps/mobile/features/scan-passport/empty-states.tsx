'use client';

import { CameraOff, ScanSearch } from 'lucide-react';
import type { ComponentType, ReactNode, SVGProps } from 'react';

type LucideIcon = ComponentType<SVGProps<SVGSVGElement>>;

interface EmptyShellProps {
    Icon: LucideIcon;
    message: string;
    children: ReactNode;
}

function EmptyShell({ Icon, message, children }: EmptyShellProps) {
    return (
        <div className="bg-background absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 px-8 text-center">
            <Icon className="text-foreground/70 h-10 w-10" aria-hidden />
            <p className="text-foreground max-w-xs text-base font-medium leading-snug">{message}</p>
            {children}
        </div>
    );
}

function PrimaryButton({ onClick, label }: { onClick: () => void; label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="bg-foreground text-background inline-flex h-14 w-full max-w-xs items-center justify-center rounded-full px-6 text-sm font-semibold"
        >
            {label}
        </button>
    );
}

interface CameraDeniedStateProps {
    onManualEntry: () => void;
}

export function CameraDeniedState({ onManualEntry }: CameraDeniedStateProps) {
    return (
        <EmptyShell Icon={CameraOff} message="Caméra non disponible.">
            <PrimaryButton onClick={onManualEntry} label="Saisir un code à la main" />
        </EmptyShell>
    );
}

interface QrUnreadableStateProps {
    onRetry: () => void;
}

export function QrUnreadableState({ onRetry }: QrUnreadableStateProps) {
    return (
        <EmptyShell Icon={ScanSearch} message="QR illisible. Réessaye avec plus de lumière.">
            <PrimaryButton onClick={onRetry} label="Réessayer" />
        </EmptyShell>
    );
}

interface NonLumirisQrStateProps {
    onRetry: () => void;
}

export function NonLumirisQrState({ onRetry }: NonLumirisQrStateProps) {
    return (
        <EmptyShell Icon={ScanSearch} message="Ce QR ne pointe pas vers un passeport Lumiris.">
            <PrimaryButton onClick={onRetry} label="Réessayer" />
        </EmptyShell>
    );
}
