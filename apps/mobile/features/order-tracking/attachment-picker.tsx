'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { useApiClient } from '@lumiris/api-client/react';
import { toast } from '@/lib/toast';

// Au-delà, l'envoi devient lent sur un réseau mobile et l'arbitre n'y gagne rien.
const MAX_FILES = 3;
const MAX_BYTES = 8 * 1024 * 1024;

export interface PickedFile {
    id: string;
    previewUrl: string;
}

// Sélecteur de photos : téléverse immédiatement et rend des identifiants. L'aperçu local permet
// de vérifier ce qu'on envoie AVANT de valider — sur un litige, une photo floue envoyée par erreur
// se paie cher.
export function AttachmentPicker({
    files,
    onChange,
    label = 'Ajouter une photo',
}: {
    files: readonly PickedFile[];
    onChange: (files: PickedFile[]) => void;
    label?: string;
}) {
    const client = useApiClient();
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const full = files.length >= MAX_FILES;

    async function handleSelect(event: React.ChangeEvent<HTMLInputElement>) {
        const selected = [...(event.target.files ?? [])].slice(0, MAX_FILES - files.length);
        event.target.value = '';
        if (selected.length === 0) return;

        const tooBig = selected.find((file) => file.size > MAX_BYTES);
        if (tooBig) {
            toast(`« ${tooBig.name} » dépasse 8 Mo. Choisis une photo plus légère.`);
            return;
        }

        setUploading(true);
        try {
            const uploaded = await Promise.all(
                selected.map(async (file) => ({
                    id: (await client.storage.upload(file)).id,
                    previewUrl: URL.createObjectURL(file),
                })),
            );
            onChange([...files, ...uploaded]);
        } catch {
            toast('Impossible d’envoyer la photo. Réessaie.');
        } finally {
            setUploading(false);
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
                        disabled={uploading}
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
