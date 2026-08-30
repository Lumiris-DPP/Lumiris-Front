'use client';

import { useRef, useState } from 'react';
import { FileCheck2, FileUp, Info, X } from 'lucide-react';
import { Label } from '@lumiris/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { Tabs, TabsList, TabsTrigger } from '@lumiris/ui/components/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@lumiris/ui/components/tooltip';
import { useCertificateLibrary } from '@lumiris/api-client/react';
import type { CertificateLibraryType } from '@lumiris/api-client';
import type { ExistingDoc } from '@/lib/draft-store';

interface Props {
    label: string;
    description?: string;
    accept?: string;
    certType: CertificateLibraryType;
    file: File | null;
    onFileChange: (file: File | null) => void;
    libraryId: string | null;
    onLibrarySelect: (libraryId: string | null) => void;
    /** Document déjà stocké côté backend ; affiché tant qu'aucun nouveau choix ne le remplace. */
    existing?: ExistingDoc | null;
}

// Frère de DocUploadField, réservé aux deux champs certificat : offre en plus la sélection d'un
// certificat déjà présent dans la bibliothèque de l'artisan (voir CertificateLibrary,
// /certifications), en alternative à un nouvel upload spécifique à ce passeport.
export function CertUploadField({
    label,
    description,
    accept = 'application/pdf',
    certType,
    file,
    onFileChange,
    libraryId,
    onLibrarySelect,
    existing,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const { data: library = [] } = useCertificateLibrary();
    const options = library.filter((item) => item.type === certType);

    // État d'onglet indépendant : dériver activeTab de libraryId seul empêchait de jamais
    // atteindre l'onglet bibliothèque (basculer dessus efface le fichier mais ne fixe pas
    // libraryId tant que rien n'est choisi dans le Select — la valeur retombait donc aussitôt
    // sur 'new'). L'initialisation reste alignée sur l'état déjà persisté du brouillon.
    const [activeTab, setActiveTab] = useState<'new' | 'library'>(libraryId ? 'library' : 'new');

    const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFileChange(e.target.files?.[0] ?? null);
        e.target.value = '';
    };

    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
                <Label className="text-sm font-medium">{label}</Label>
                {description && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 shrink-0 cursor-help text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs leading-relaxed">{description}</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>

            <Tabs
                value={activeTab}
                onValueChange={(v) => {
                    const tab = v as 'new' | 'library';
                    setActiveTab(tab);
                    if (tab === 'new') onLibrarySelect(null);
                    else onFileChange(null);
                }}
            >
                <TabsList className="h-8">
                    <TabsTrigger value="new" className="text-xs">
                        Nouveau fichier
                    </TabsTrigger>
                    <TabsTrigger value="library" className="text-xs">
                        Depuis ma bibliothèque
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {activeTab === 'library' ? (
                <Select value={libraryId ?? undefined} onValueChange={(v) => onLibrarySelect(v)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Choisir un certificat…" />
                    </SelectTrigger>
                    <SelectContent>
                        {options.length === 0 ? (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                Aucun certificat de ce type dans votre bibliothèque.
                            </div>
                        ) : (
                            options.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                    {item.filename ?? 'Certificat'}
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
            ) : file ? (
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <span className="truncate text-sm">{file.name}</span>
                    <button
                        type="button"
                        onClick={() => onFileChange(null)}
                        className="ml-2 shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label="Supprimer le fichier"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : existing ? (
                <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                    <FileCheck2 className="h-4 w-4 shrink-0 text-lumiris-emerald" />
                    <span className="truncate text-sm">{existing.filename || 'Document déjà envoyé'}</span>
                    {existing.url && (
                        <a
                            href={existing.url}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-auto shrink-0 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                        >
                            Voir
                        </a>
                    )}
                    <label
                        className={`shrink-0 cursor-pointer text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground ${existing.url ? '' : 'ml-auto'}`}
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
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/40 px-4 py-2.5 transition-colors hover:bg-muted">
                    <FileUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Cliquez pour ajouter un fichier</span>
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
