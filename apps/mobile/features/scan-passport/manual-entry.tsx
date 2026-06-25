'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetTitle } from '@lumiris/ui/components/sheet';

const PASSPORT_URL_RE = /lumiris\.(?:fr|com)\/(?:passeport|p)\/([\w-]+)/i;

function extractPassportId(input: string): string | null {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const url = trimmed.match(PASSPORT_URL_RE);
    if (url?.[1]) return url[1];
    return trimmed;
}

interface ManualEntrySheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ManualEntrySheet({ open, onOpenChange }: ManualEntrySheetProps) {
    const router = useRouter();
    const [value, setValue] = useState('');
    const settledRef = useRef(false);

    const submit = useCallback(() => {
        if (settledRef.current) return;
        const id = extractPassportId(value);
        if (!id) return;
        settledRef.current = true;
        onOpenChange(false);
        router.push(`/passeport/${id}`);
    }, [router, value, onOpenChange]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="mx-auto max-w-md rounded-t-3xl px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-8"
            >
                <SheetTitle className="sr-only">Saisir un code passeport</SheetTitle>
                <input
                    // eslint-disable-next-line jsx-a11y/no-autofocus -- bottom-sheet d'action ciblée : le focus immédiat est intentionnel.
                    autoFocus
                    type="text"
                    inputMode="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            submit();
                        }
                    }}
                    onBlur={submit}
                    placeholder="GTIN ou lumiris.com/p/..."
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    aria-label="Identifiant ou URL du passeport"
                    className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-foreground h-14 w-full rounded-2xl border px-4 font-mono text-sm outline-none"
                />
            </SheetContent>
        </Sheet>
    );
}

export function ManualEntry() {
    const router = useRouter();
    const [open, setOpen] = useState(true);
    return (
        <ManualEntrySheet
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (!next) router.back();
            }}
        />
    );
}
