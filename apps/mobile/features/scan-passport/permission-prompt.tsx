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
            className="bg-background absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 px-8 text-center"
        >
            <Camera className="text-foreground/80 h-10 w-10" aria-hidden />
            <p id="camera-prompt-title" className="text-foreground max-w-xs text-base font-medium leading-snug">
                Autoriser la caméra pour scanner un passeport produit.
            </p>
            <button
                type="button"
                onClick={onActivate}
                className="bg-foreground text-background hover:bg-foreground/90 inline-flex h-14 w-full max-w-xs items-center justify-center rounded-full px-6 text-sm font-semibold"
            >
                Autoriser
            </button>
        </div>
    );
}
