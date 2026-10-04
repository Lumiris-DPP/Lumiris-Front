'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { useApiClient } from '@lumiris/api-client/react';
import { toast } from '@/lib/toast';

const MAX_FILES = 3;
const MAX_BYTES = 8 * 1024 * 1024;

export interface PickedFile {
    id: string;
    previewUrl: string;
}

// Permet de choisir et d’envoyer les pièces jointes.
export function AttachmentPicker({
    files,
    onChange,
    label = 'Ajouter une photo',
    disabled = false,
    onUploadingChange,
}: {
    files: readonly PickedFile[];
    onChange: (files: PickedFile[]) => void;
    label?: string;
    disabled?: boolean;
    onUploadingChange: (uploading: boolean) => void;
}) {
    const client = useApiClient();
    const inputRef = useRef<HTMLInputElement>(null);
    const previewUrlsRef = useRef(new Set<string>());
    const [uploading, setUploading] = useState(false);
    const mounted = useRef(false);
    const full = files.length >= MAX_FILES;

    useEffect(() => {
        const tracked = previewUrlsRef.current;
        const stillShown = new Set(files.map((file) => file.previewUrl));
        for (const url of tracked) {
            if (stillShown.has(url)) continue;
            URL.revokeObjectURL(url);
            tracked.delete(url);
        }
    }, [files]);

    useEffect(() => {
        mounted.current = true;
        const tracked = previewUrlsRef.current;
        return () => {
            mounted.current = false;
            for (const url of tracked) URL.revokeObjectURL(url);
            tracked.clear();
        };
    }, []);

    // Envoie les fichiers choisis et signale les erreurs.
    async function handleSelect(event: React.ChangeEvent<HTMLInputElement>) {
        if (uploading || disabled) return;
        const selected = [...(event.target.files ?? [])].slice(0, MAX_FILES - files.length);
        event.target.value = '';
        if (selected.length === 0) return;

        const tooBig = selected.find((file) => file.size > MAX_BYTES);
        if (tooBig) {
            toast(`« ${tooBig.name} » dépasse 8 Mo. Choisis une photo plus légère.`);
            return;
        }

        setUploading(true);
        onUploadingChange(true);
        try {
            const results = await Promise.allSettled(selected.map((file) => client.storage.upload(file)));
            if (!mounted.current) return;
            const uploaded: PickedFile[] = [];
            results.forEach((result, index) => {
                if (result.status !== 'fulfilled') return;
                const file = selected[index];
                if (!file) return;
                const previewUrl = URL.createObjectURL(file);
                previewUrlsRef.current.add(previewUrl);
                uploaded.push({ id: result.value.id, previewUrl });
            });
            onChange([...files, ...uploaded]);
            if (results.some((result) => result.status === 'rejected')) {
                toast('Certaines photos n’ont pas pu être envoyées. Les photos réussies sont conservées.');
            }
        } catch {
            toast('Impossible d’envoyer la photo. Réessaie.');
        } finally {
            if (mounted.current) {
                setUploading(false);
                onUploadingChange(false);
            }
        }
    }

    return (
        <div className="mt-3">
            <div className="flex flex-wrap items-center gap-2">
                {files.map((file) => (
                    <span key={file.id} className="relative h-16 w-16 overflow-hidden rounded-xl bg-muted">
                        <Image src={file.previewUrl} alt="" fill sizes="64px" className="object-cover" unoptimized />
                        <button
                            type="button"
                            aria-label="Retirer cette photo"
                            disabled={uploading || disabled}
                            onClick={() => onChange(files.filter((f) => f.id !== file.id))}
                            className="absolute top-0.5 right-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-background/90 text-foreground"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </span>
                ))}

                {full ? null : (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={uploading || disabled}
                        className="inline-flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-[10px] text-muted-foreground disabled:opacity-50"
                    >
                        {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ImagePlus className="h-4 w-4" aria-hidden />
                        )}
                        Photo
                    </button>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                aria-label={label}
                onChange={handleSelect}
                className="hidden"
            />
            <p className="mt-1.5 text-[10px] text-muted-foreground">
                {files.length > 0
                    ? `${files.length}/${MAX_FILES} photo${files.length > 1 ? 's' : ''} jointe${files.length > 1 ? 's' : ''}`
                    : 'Une photo rend ta demande vérifiable — et bien plus rapide à traiter.'}
            </p>
        </div>
    );
}
