'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@lumiris/ui/components/sheet';
import { AttachmentPicker, type PickedFile } from './attachment-picker';

// Une seule feuille pour toutes les actions qui n'exigent qu'un texte : demander un retour,
// ouvrir un litige, répondre dans un litige. Le libellé arrive en props — la feuille ne connaît
// aucune de ces trois situations.
export function ReasonSheet({
    open,
    title,
    description,
    placeholder,
    suggestions,
    submitLabel,
    pending,
    withAttachments = false,
    onSubmit,
    onClose,
}: {
    open: boolean;
    title: string;
    description: string;
    placeholder: string;
    suggestions?: readonly string[];
    submitLabel: string;
    pending: boolean;
    /** Autorise les photos : pertinent pour un retour, un litige ou un message, pas pour une annulation. */
    withAttachments?: boolean;
    onSubmit: (reason: string, fileIds: string[]) => void;
    onClose: () => void;
}) {
    const [reason, setReason] = useState('');
    const [files, setFiles] = useState<PickedFile[]>([]);

    useEffect(() => {
        if (open) {
            setReason('');
            setFiles([]);
        }
    }, [open]);

    const valid = reason.trim().length >= 5;

    return (
        <Sheet
            open={open}
            onOpenChange={(next) => {
                if (!next) onClose();
            }}
        >
            <SheetContent
                side="bottom"
                className="mx-auto max-h-[85dvh] max-w-md overflow-y-auto rounded-t-3xl px-5 pt-5 pb-8"
            >
                <SheetHeader className="p-0 pr-10">
                    <SheetTitle className="text-base font-bold">{title}</SheetTitle>
                    <SheetDescription className="text-xs">{description}</SheetDescription>
                </SheetHeader>

                {suggestions?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {suggestions.map((suggestion) => (
                            <button
                                key={suggestion}
                                type="button"
                                onClick={() => setReason(suggestion)}
                                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                                    reason === suggestion
                                        ? 'border-foreground bg-foreground text-primary-foreground'
                                        : 'border-border text-foreground'
                                }`}
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                ) : null}

                {/* Le titre de la feuille sert d'étiquette au champ : le répéter au-dessus du
                    textarea alourdirait l'écran sans rien apprendre. */}
                <textarea
                    aria-label={title}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    placeholder={placeholder}
                    className="mt-3 w-full resize-none rounded-2xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-foreground"
                />

                {withAttachments ? <AttachmentPicker files={files} onChange={setFiles} /> : null}

                <button
                    type="button"
                    disabled={!valid || pending}
                    onClick={() =>
                        onSubmit(
                            reason.trim(),
                            files.map((f) => f.id),
                        )
                    }
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
                >
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {submitLabel}
                </button>
            </SheetContent>
        </Sheet>
    );
}
