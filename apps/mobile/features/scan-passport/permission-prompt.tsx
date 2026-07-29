'use client';

import { Camera } from 'lucide-react';

interface PermissionPromptProps {
    onActivate: () => void;
}

export function PermissionPrompt({ onActivate }: PermissionPromptProps) {
    return (
        <div
            role="dialog"
            aria-labelledby="camera-prompt-title"
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-background px-8 text-center"
        >
            <Camera className="h-10 w-10 text-foreground/80" aria-hidden />
            <p id="camera-prompt-title" className="max-w-xs text-base leading-snug font-medium text-foreground">
                Autoriser la caméra pour scanner un passeport produit.
            </p>
            <button
                type="button"
                onClick={onActivate}
                className="inline-flex h-14 w-full max-w-xs items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background hover:bg-foreground/90"
            >
                Autoriser
            </button>
        </div>
    );
}
