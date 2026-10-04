'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@lumiris/ui/components/sheet';
import { AttachmentPicker, type PickedFile } from './attachment-picker';

// Permet de saisir un motif et ses pièces jointes.
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

    withAttachments?: boolean;
    onSubmit: (reason: string, fileIds: string[]) => void;
    onClose: () => void;
}) {
    const [uploading, setUploading] = useState(false);
    const [reason, setReason] = useState('');
    const [files, setFiles] = useState<PickedFile[]>([]);

    useEffect(() => {
        if (open) {
            setUploading(false);
            setReason('');
            setFiles([]);
        }
    }, [open]);

    const valid = reason.trim().length >= 5;
    const busy = pending || uploading;

    return (
        <Sheet
            open={open}
            onOpenChange={(next) => {
                if (!next && !busy) onClose();
            }}
        >
            <SheetContent
                side="bottom"
                onEscapeKeyDown={(event) => {
                    if (busy) event.preventDefault();
                }}
                onInteractOutside={(event) => {
                    if (busy) event.preventDefault();
                }}
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
                                disabled={pending}
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

                <textarea
                    aria-label={title}
                    disabled={pending}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    placeholder={placeholder}
                    className="mt-3 w-full resize-none rounded-2xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-foreground"
                />

                {withAttachments && open ? (
                    <AttachmentPicker
                        files={files}
                        onChange={setFiles}
                        disabled={pending}
                        onUploadingChange={setUploading}
                    />
                ) : null}

                <button
                    type="button"
                    disabled={!valid || busy}
                    onClick={() =>
                        onSubmit(
                            reason.trim(),
                            files.map((f) => f.id),
                        )
                    }
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
                >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {submitLabel}
                </button>
            </SheetContent>
        </Sheet>
    );
}
