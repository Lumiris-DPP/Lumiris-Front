'use client';

import { useRef } from 'react';
import { FileUp, X, Info } from 'lucide-react';
import { Label } from '@lumiris/ui/components/label';
import { Badge } from '@lumiris/ui/components/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@lumiris/ui/components/tooltip';

interface Props {
    label: string;
    description?: string;
    accept?: string;
    value: File | null;
    onChange: (file: File | null) => void;
    advisory?: string;
}

export function DocUploadField({ label, description, accept = 'application/pdf', value, onChange, advisory }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
                <Label className="text-sm font-medium">{label}</Label>
                {advisory && (
                    <Badge variant="outline" className="border-lumiris-amber px-1.5 py-0 text-[10px] text-lumiris-amber">
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
            ) : (
                <label className="border-border bg-muted/40 hover:bg-muted flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed px-4 py-2.5 transition-colors">
                    <FileUp className="text-muted-foreground h-4 w-4 shrink-0" />
                    <span className="text-muted-foreground text-sm">Cliquez pour ajouter un fichier</span>
                    <input
                        ref={inputRef}
                        type="file"
                        accept={accept}
                        className="sr-only"
                        onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            onChange(file);
                            e.target.value = '';
                        }}
                    />
                </label>
            )}
        </div>
    );
}
