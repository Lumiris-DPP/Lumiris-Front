'use client';

import { useRouter } from 'next/navigation';
import { Eye, Loader2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { DppFormSummaryDto } from '@lumiris/api-client';
import { useDeleteDppForm } from '@lumiris/api-client/react';
import { garmentCategoryLabel } from '@lumiris/scoring-ui';
import { formatDateFr } from '@lumiris/utils';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent } from '@lumiris/ui/components/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@lumiris/ui/components/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { toast } from '@lumiris/ui/components/sonner';
import { useEditDraft } from '@/lib/use-edit-draft';

interface DppTableProps {
    rows: DppFormSummaryDto[];
}

function StatusBadge({ status }: { status: DppFormSummaryDto['status'] }) {
    if (status === 'DRAFT') {
        return (
            <Badge variant="outline" className="border-lumiris-amber/40 text-lumiris-amber bg-lumiris-amber/5">
                Brouillon
            </Badge>
        );
    }
    if (status === 'VALID') {
        return <Badge variant="default">Publié</Badge>;
    }
    return <Badge variant="destructive">Invalide</Badge>;
}

export function DppTable({ rows }: DppTableProps) {
    const router = useRouter();
    const { editDraft, loadingId } = useEditDraft();
    const deleteDpp = useDeleteDppForm();

    const openRow = (dpp: DppFormSummaryDto) => {
        if (dpp.status === 'DRAFT') void editDraft(dpp.id);
        else router.push(`/passports/${dpp.id}`);
    };

    const onDelete = async (dpp: DppFormSummaryDto) => {
        if (
            !window.confirm(
                `Supprimer le brouillon « ${dpp.productName ?? 'Sans nom'} » ? Cette action est définitive.`,
            )
        )
            return;
        try {
            await deleteDpp.mutateAsync(dpp.id);
            toast.success('Brouillon supprimé.');
        } catch {
            toast.error('La suppression a échoué. Réessayez.');
        }
    };

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom du produit</TableHead>
                            <TableHead>Catégorie</TableHead>
                            <TableHead>Créé le</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="w-12" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-muted-foreground py-12 text-center text-sm">
                                    Aucun DPP trouvé.
                                </TableCell>
                            </TableRow>
                        )}
                        {rows.map((dpp) => {
                            const isDraft = dpp.status === 'DRAFT';
                            return (
                                <TableRow key={dpp.id} className="cursor-pointer" onClick={() => openRow(dpp)}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{dpp.productName ?? 'Sans nom'}</p>
                                            {loadingId === dpp.id && (
                                                <Loader2 className="text-muted-foreground h-3.5 w-3.5 animate-spin" />
                                            )}
                                        </div>
                                        {dpp.sku && (
                                            <p className="text-muted-foreground font-mono text-xs">{dpp.sku}</p>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {garmentCategoryLabel(dpp.productCategory)}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs">
                                        {formatDateFr(dpp.createdAt)}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={dpp.status} />
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8"
                                                    aria-label={`Actions pour ${dpp.productName ?? 'ce DPP'}`}
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-44">
                                                {isDraft ? (
                                                    <>
                                                        <DropdownMenuItem onClick={() => void editDraft(dpp.id)}>
                                                            <Pencil className="h-3.5 w-3.5" /> Modifier
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            variant="destructive"
                                                            onClick={() => void onDelete(dpp)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" /> Supprimer
                                                        </DropdownMenuItem>
                                                    </>
                                                ) : (
                                                    <DropdownMenuItem
                                                        onClick={() => router.push(`/passports/${dpp.id}`)}
                                                    >
                                                        <Eye className="h-3.5 w-3.5" /> Voir détail
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
