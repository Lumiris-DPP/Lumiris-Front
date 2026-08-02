'use client';

import Image from 'next/image';
import { useId, useRef } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import { Input } from '@lumiris/ui/components/input';
import { formatBytes } from '@lumiris/utils';
import { cn } from '@lumiris/ui/lib/cn';
import { MAX_UPLOAD_LABEL, isImageMime } from '@/lib/file-upload';

export interface PickedFile {
    name: string;
    type: string;
    dataUri: string;
    size: number;
}

interface Props {
    file: PickedFile | null;
    dragActive: boolean;
    onDragActiveChange: (active: boolean) => void;
    onFiles: (list: FileList | null) => void;
    onClear: () => void;
    accept: string;
}

export function ImportFilePicker({ file, dragActive, onDragActiveChange, onFiles, onClear, accept }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const inputId = useId();

    if (file) {
        const isImage = isImageMime(file.type);
        return (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                {isImage ? (
                    <Image
                        src={file.dataUri}
                        alt={file.name}
                        width={64}
                        height={64}
                        unoptimized
                        className="h-16 w-16 rounded-md border border-border object-cover"
                    />
                ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-md border border-border bg-muted">
                        <FileText className="h-7 w-7 text-muted-foreground" />
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClear} aria-label="Retirer">
                    <X className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <label
            htmlFor={inputId}
            onDragOver={(e) => {
                e.preventDefault();
                onDragActiveChange(true);
            }}
            onDragLeave={() => onDragActiveChange(false)}
            onDrop={(e) => {
                e.preventDefault();
                onDragActiveChange(false);
                onFiles(e.dataTransfer.files);
            }}
            className={cn(
                'relative flex h-40 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-muted/40 transition-colors hover:bg-muted',
                dragActive && 'border-lumiris-cyan bg-lumiris-cyan/5',
            )}
        >
            <Upload className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Glissez une facture ou cliquez ici</p>
            <p className="text-xs text-muted-foreground">PDF · JPG · PNG · {MAX_UPLOAD_LABEL} max</p>
            <Input
                id={inputId}
                ref={inputRef}
                type="file"
                accept={accept}
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={(e) => onFiles(e.target.files)}
            />
        </label>
    );
}
