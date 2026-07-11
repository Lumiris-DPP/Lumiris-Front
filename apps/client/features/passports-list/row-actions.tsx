'use client';

import Link from 'next/link';
import { Copy, Eye, ExternalLink, FileText, MoreHorizontal, Pencil, Printer, QrCode, Trash2 } from 'lucide-react';
import type { Passport } from '@lumiris/types';
import { Button } from '@lumiris/ui/components/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@lumiris/ui/components/dropdown-menu';
import { useDraftStore } from '@/lib/draft-store';
import { isDraftLike, resumeHref } from '@/lib/passport-status';

interface RowActionsProps {
    passport: Passport;
    onShowQr: () => void;
    onDuplicate: () => void;
    onPreview: () => void;
    onDelete: () => void;
}

export function RowActions({ passport, onShowQr, onDuplicate, onPreview, onDelete }: RowActionsProps) {
    const isPublished = passport.status === 'Published';
    const draftLike = isDraftLike(passport.status);
    const lastStep = useDraftStore((s) => s.drafts[passport.id]?.lastStep);
    const ref = passport.garment.reference || passport.id;
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Actions pour ${ref}`}>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
                {draftLike && (
                    <DropdownMenuItem asChild>
                        <Link href={resumeHref(passport, lastStep)}>
                            <Pencil className="h-3.5 w-3.5" /> Continuer
                        </Link>
                    </DropdownMenuItem>
                )}
                {isPublished && (
                    <>
                        <DropdownMenuItem onClick={onShowQr}>
                            <QrCode className="h-3.5 w-3.5" /> Voir QR
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/passports/${passport.id}`}>
                                <Eye className="h-3.5 w-3.5" /> Voir détail
                            </Link>
                        </DropdownMenuItem>
                    </>
                )}
                <DropdownMenuItem onClick={onDuplicate}>
                    <Copy className="h-3.5 w-3.5" /> Dupliquer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onPreview}>
                    <ExternalLink className="h-3.5 w-3.5" /> Aperçu client
                </DropdownMenuItem>
                {isPublished && (
                    <DropdownMenuItem asChild>
                        <Link href={`/print/passport/${passport.id}`} target="_blank">
                            <FileText className="h-3.5 w-3.5" /> Imprimer fiche
                        </Link>
                    </DropdownMenuItem>
                )}
                {isPublished && (
                    <DropdownMenuItem asChild>
                        <Link href={`/print/${passport.id}`} target="_blank">
                            <Printer className="h-3.5 w-3.5" /> Imprimer étiquette
                        </Link>
                    </DropdownMenuItem>
                )}
                {draftLike && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={onDelete}>
                            <Trash2 className="h-3.5 w-3.5" /> Supprimer
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
