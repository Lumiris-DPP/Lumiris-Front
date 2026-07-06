'use client';

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
            <div className="border-border bg-card flex items-center gap-3 rounded-lg border p-3">
                {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={file.dataUri}
                        alt={file.name}
                        className="border-border h-16 w-16 rounded-md border object-cover"
                    />
                ) : (
                    <div className="border-border bg-muted flex h-16 w-16 items-center justify-center rounded-md border">
                        <FileText className="text-muted-foreground h-7 w-7" />
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-sm font-medium">{file.name}</p>
                    <p className="text-muted-foreground text-xs">{formatBytes(file.size)}</p>
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
                'border-border bg-muted/40 hover:bg-muted relative flex h-40 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed transition-colors',
                dragActive && 'border-lumiris-emerald bg-lumiris-emerald/5',
            )}
        >
            <Upload className="text-muted-foreground h-6 w-6" />
            <p className="text-foreground text-sm font-medium">Glissez une facture ou cliquez ici</p>
            <p className="text-muted-foreground text-xs">PDF · JPG · PNG · {MAX_UPLOAD_LABEL} max</p>
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
