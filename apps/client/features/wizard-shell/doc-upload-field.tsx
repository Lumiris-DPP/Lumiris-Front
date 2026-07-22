'use client';

import { useRef } from 'react';
import { FileCheck2, FileUp, X, Info } from 'lucide-react';
import { Label } from '@lumiris/ui/components/label';
import { Badge } from '@lumiris/ui/components/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@lumiris/ui/components/tooltip';
import type { ExistingDoc } from '@/lib/draft-store';

interface Props {
    label: string;
    description?: string;
    accept?: string;
    value: File | null;
    onChange: (file: File | null) => void;
    advisory?: string;
    /** Document déjà stocké côté backend ; affiché tant qu'aucun nouveau fichier ne le remplace. */
    existing?: ExistingDoc | null;
}

export function DocUploadField({
    label,
    description,
    accept = 'application/pdf',
    value,
    onChange,
    advisory,
    existing,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.files?.[0] ?? null);
        e.target.value = '';
    };

    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
                <Label className="text-sm font-medium">{label}</Label>
                {advisory && (
                    <Badge
                        variant="outline"
                        className="border-lumiris-amber text-lumiris-amber px-1.5 py-0 text-[10px]"
                    >
                        {advisory}
                    </Badge>
                )}
                {description && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="text-muted-foreground h-3.5 w-3.5 shrink-0 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs leading-relaxed">{description}</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>

            {value ? (
                <div className="border-border flex items-center justify-between rounded-lg border px-3 py-2">
                    <span className="truncate text-sm">{value.name}</span>
                    <button
                        type="button"
                        onClick={() => onChange(null)}
                        className="text-muted-foreground hover:text-destructive ml-2 shrink-0"
                        aria-label="Supprimer le fichier"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : existing ? (
                // Le document est déjà stocké côté backend : on ne peut pas repeupler l'input
                // (un `File` ne se reconstruit pas), on montre donc son état et on propose de le remplacer.
                <div className="border-border flex items-center gap-2 rounded-lg border px-3 py-2">
                    <FileCheck2 className="text-lumiris-emerald h-4 w-4 shrink-0" />
                    <span className="truncate text-sm">{existing.filename || 'Document déjà envoyé'}</span>
                    {existing.url && (
                        <a
                            href={existing.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground ml-auto shrink-0 text-xs underline underline-offset-2"
                        >
                            Voir
                        </a>
                    )}
                    <label
                        className={`text-muted-foreground hover:text-foreground shrink-0 cursor-pointer text-xs underline underline-offset-2 ${existing.url ? '' : 'ml-auto'}`}
                    >
                        Remplacer
                        <input
                            ref={inputRef}
                            type="file"
                            accept={accept}
                            aria-label={`${label} — importer un fichier`}
                            className="sr-only"
                            onChange={handlePick}
                        />
                    </label>
                </div>
            ) : (
                <label className="border-border bg-muted/40 hover:bg-muted flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed px-4 py-2.5 transition-colors">
                    <FileUp className="text-muted-foreground h-4 w-4 shrink-0" />
                    <span className="text-muted-foreground text-sm">Cliquez pour ajouter un fichier</span>
                    <input
                        ref={inputRef}
                        type="file"
                        accept={accept}
                        aria-label={`${label} — importer un fichier`}
                        className="sr-only"
                        onChange={handlePick}
                    />
                </label>
            )}
        </div>
    );
}
