'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetTitle } from '@lumiris/ui/components/sheet';
import { routes } from '@/lib/routes';

const PUBLIC_CODE_QUERY_RE = /\/p\/?\?(?:[^#]*&)?c=([\w-]{8})\b/i;
const PUBLIC_CODE_PATH_RE = /\/p\/([\w-]{8})\b/i;
const PASSPORT_URL_RE = /lumiris\.(?:fr|com)\/passeport\/([\w-]+)/i;
const PUBLIC_CODE_RE = /^[A-Z0-9]{8}$/i;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Destination = { route: '/p/[code]'; code: string } | { route: '/passeport/[id]'; id: string } | null;

function resolveDestination(input: string): Destination {
    const trimmed = input.trim();
    if (!trimmed) return null;

    const publicUrlMatch = trimmed.match(PUBLIC_CODE_QUERY_RE) ?? trimmed.match(PUBLIC_CODE_PATH_RE);
    if (publicUrlMatch?.[1]) return { route: '/p/[code]', code: publicUrlMatch[1].toUpperCase() };

    const passportUrlMatch = trimmed.match(PASSPORT_URL_RE);
    if (passportUrlMatch?.[1]) return { route: '/passeport/[id]', id: passportUrlMatch[1] };

    if (PUBLIC_CODE_RE.test(trimmed)) return { route: '/p/[code]', code: trimmed.toUpperCase() };
    if (UUID_RE.test(trimmed)) return { route: '/passeport/[id]', id: trimmed };

    return null;
}

interface ManualEntrySheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ManualEntrySheet({ open, onOpenChange }: ManualEntrySheetProps) {
    const router = useRouter();
    const [value, setValue] = useState('');
    const settledRef = useRef(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // The code field is the only control of this sheet, so land the caret in it.
    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    const submit = useCallback(() => {
        if (settledRef.current) return;
        const dest = resolveDestination(value);
        if (!dest) return;
        settledRef.current = true;
        onOpenChange(false);
        if (dest.route === '/p/[code]') {
            router.push(routes.publicPassport(dest.code));
        } else {
            router.push(`/passeport/${dest.id}`);
        }
    }, [router, value, onOpenChange]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="mx-auto max-w-md rounded-t-3xl px-6 pt-8 pb-[max(env(safe-area-inset-bottom),1.5rem)]"
            >
                <SheetTitle className="sr-only">Saisir un code passeport</SheetTitle>
                <input
                    ref={inputRef}
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
                    placeholder="Code DPP (ex : ABC12345) ou URL"
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    aria-label="Identifiant ou URL du passeport"
                    className="h-14 w-full rounded-2xl border border-border bg-background px-4 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-foreground"
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
