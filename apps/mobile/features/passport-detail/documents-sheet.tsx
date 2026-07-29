'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
    BookOpen,
    ExternalLink,
    FileText,
    Paperclip,
    Receipt,
    Shield,
    ShieldCheck,
    Trash2,
    Upload,
    Wrench,
} from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import { RadioGroup, RadioGroupItem } from '@lumiris/ui/components/radio-group';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@lumiris/ui/components/sheet';
import { cn } from '@lumiris/ui/lib/cn';
import {
    type DocumentKind,
    type WardrobeDocument,
    DOCUMENT_KINDS,
    attachDocumentToPassport,
    detachDocument,
} from '@/lib/wardrobe-storage';
import {
    ACCEPTED_DOCUMENT_MIMES,
    MAX_DOCUMENT_BYTES,
    decryptToBlob,
    encryptFile,
    isAcceptedDocumentMime,
} from '@/lib/documents/crypto';
import { useUser } from '@/lib/auth';
import { toast } from '@/lib/toast';

interface DocumentsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    passportId: string;
    documents: readonly WardrobeDocument[];
}

export const DOCUMENT_KIND_LABEL: Record<DocumentKind, string> = {
    invoice: "Facture d'achat",
    warranty: 'Garantie',
    insurance: 'Assurance',
    receipt: 'Ticket de caisse',
    'repair-receipt': 'Ticket de réparation',
    manual: 'Notice',
    other: 'Autre',
};

export const DOCUMENT_KIND_ICON: Record<DocumentKind, typeof FileText> = {
    invoice: Receipt,
    warranty: ShieldCheck,
    insurance: Shield,
    receipt: Receipt,
    'repair-receipt': Wrench,
    manual: BookOpen,
    other: FileText,
};

export function DocumentsSheet({ open, onOpenChange, passportId, documents }: DocumentsSheetProps) {
    const [pendingKind, setPendingKind] = useState<DocumentKind>('invoice');
    const [busy, setBusy] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useUser();
    const userId = user?.id ?? null;
    const itemKey = `lumiris:${passportId}`;

    const grouped = useMemo(() => {
        const buckets = new Map<DocumentKind, WardrobeDocument[]>();
        for (const doc of documents) {
            const existing = buckets.get(doc.kind);
            if (existing) existing.push(doc);
            else buckets.set(doc.kind, [doc]);
        }
        return buckets;
    }, [documents]);

    const onPickFile = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const onFileChange = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;

            if (!isAcceptedDocumentMime(file.type)) {
                toast.error('Format non supporté (PDF, PNG, JPEG, WebP)');
                return;
            }
            if (file.size > MAX_DOCUMENT_BYTES) {
                toast.error('Fichier trop lourd (max 5 Mo)');
                return;
            }

            setBusy(true);
            try {
                const { ciphertext, iv } = await encryptFile(file, userId);
                const doc: WardrobeDocument = {
                    id: crypto.randomUUID(),
                    kind: pendingKind,
                    fileName: file.name,
                    mimeType: file.type,
                    byteLength: file.size,
                    addedAt: new Date().toISOString(),
                    ciphertext,
                    iv,
                };
                attachDocumentToPassport(passportId, doc);
                toast.success('Document ajouté');
            } catch {
                toast.error('Échec du chiffrement du document');
            } finally {
                setBusy(false);
            }
        },
        [pendingKind, passportId, userId],
    );

    const onOpenDoc = useCallback(
        async (doc: WardrobeDocument) => {
            try {
                const blob = await decryptToBlob(doc, userId);
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank', 'noopener,noreferrer');
                window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
            } catch {
                toast.error('Impossible de déchiffrer ce document');
            }
        },
        [userId],
    );

    const onDeleteDoc = useCallback(
        (doc: WardrobeDocument) => {
            detachDocument(itemKey, doc.id);
            toast.success('Document supprimé');
        },
        [itemKey],
    );

    const total = documents.length;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="mx-auto max-h-[85dvh] max-w-md overflow-y-auto rounded-t-3xl pb-[max(env(safe-area-inset-bottom),1.5rem)]"
            >
                <SheetHeader className="pt-5 pb-2">
                    <SheetTitle className="text-base text-foreground">Documents</SheetTitle>
                    <SheetDescription>
                        {total === 0
                            ? "Joins ici tes factures, garanties, contrats d'assurance, tickets ou notices."
                            : `${total} document${total > 1 ? 's' : ''} chiffré${total > 1 ? 's' : ''} sur cet appareil.`}
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-4 px-4 pb-4">
                    <fieldset className="flex flex-col gap-2">
                        <legend className="text-[11px] font-semibold tracking-wider text-foreground uppercase">
                            Type de document
                        </legend>
                        <RadioGroup
                            value={pendingKind}
                            onValueChange={(value) => setPendingKind(value as DocumentKind)}
                            className="grid grid-cols-2 gap-2"
                            aria-label="Type de document à joindre"
                        >
                            {DOCUMENT_KINDS.map((k) => (
                                <label
                                    key={k}
                                    htmlFor={`docs-kind-${k}`}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card p-2.5 text-xs transition-colors',
                                        pendingKind === k ? 'border-foreground bg-card/90' : 'hover:bg-card/80',
                                    )}
                                >
                                    <RadioGroupItem id={`docs-kind-${k}`} value={k} />
                                    <span className="text-foreground">{DOCUMENT_KIND_LABEL[k]}</span>
                                </label>
                            ))}
                        </RadioGroup>
                    </fieldset>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_DOCUMENT_MIMES.join(',')}
                        onChange={onFileChange}
                        className="hidden"
                        aria-hidden
                    />

                    <Button
                        type="button"
                        onClick={onPickFile}
                        disabled={busy}
                        className="h-11 w-full rounded-full bg-foreground text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-60"
                    >
                        <Upload className="h-4 w-4" />
                        {busy ? 'Chiffrement…' : 'Joindre un document'}
                    </Button>

                    {total === 0 ? (
                        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-6 text-center">
                            <span
                                aria-hidden
                                className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-background/60"
                            >
                                <Paperclip className="h-5 w-5 text-muted-foreground" />
                            </span>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                                Joins ici tes factures, garanties, contrats d&apos;assurance, tickets ou notices.
                            </p>
                            <p className="text-[11px] text-muted-foreground/70">PDF, PNG, JPEG ou WebP — 5 Mo max.</p>
                        </div>
                    ) : (
                        <ul className="flex flex-col gap-4">
                            {DOCUMENT_KINDS.map((kind) => {
                                const list = grouped.get(kind);
                                if (!list || list.length === 0) return null;
                                return (
                                    <li key={kind} className="flex flex-col gap-2">
                                        <h3 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                            {DOCUMENT_KIND_LABEL[kind]} ({list.length})
                                        </h3>
                                        <ul className="flex flex-col gap-2">
                                            {list.map((doc) => (
                                                <li key={doc.id}>
                                                    <DocumentRow
                                                        doc={doc}
                                                        onOpen={() => onOpenDoc(doc)}
                                                        onDelete={() => onDeleteDoc(doc)}
                                                    />
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

function DocumentRow({ doc, onOpen, onDelete }: { doc: WardrobeDocument; onOpen: () => void; onDelete: () => void }) {
    const Icon = DOCUMENT_KIND_ICON[doc.kind];
    const date = new Date(doc.addedAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
    return (
        <article className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
            <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
            >
                <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{doc.fileName}</p>
                <p className="text-[11px] text-muted-foreground">
                    {humanSize(doc.byteLength)} · {date}
                </p>
            </div>
            <button
                type="button"
                onClick={onOpen}
                aria-label={`Ouvrir ${doc.fileName}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-card"
            >
                <ExternalLink className="h-3.5 w-3.5" />
            </button>
            <button
                type="button"
                onClick={onDelete}
                aria-label={`Supprimer ${doc.fileName}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-lumiris-rose/30 text-lumiris-rose hover:bg-lumiris-rose/10"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>
        </article>
    );
}

export function humanSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
