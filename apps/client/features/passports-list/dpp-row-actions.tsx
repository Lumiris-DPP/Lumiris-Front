'use client';

import { useRouter } from 'next/navigation';
import { Copy, Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { DppFormSummaryDto } from '@lumiris/api-client';
import { useDeleteDppForm, useDuplicateDppForm } from '@lumiris/api-client/react';
import { Button } from '@lumiris/ui/components/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@lumiris/ui/components/dropdown-menu';
import { toast } from '@lumiris/ui/components/sonner';
import { useEditDraft } from '@/lib/use-edit-draft';

export function useDppActions() {
    const router = useRouter();
    const { editDraft, loadingId } = useEditDraft();
    const deleteDpp = useDeleteDppForm();
    const duplicateDpp = useDuplicateDppForm();

    const open = (dpp: DppFormSummaryDto) => router.push(`/passports/${dpp.id}`);

    const duplicate = (dpp: DppFormSummaryDto) => {
        duplicateDpp.mutate(dpp.id, {
            onSuccess: (created) => {
                toast.success('Passeport dupliqué.');
                router.push(`/passports/${created.id}`);
            },
            onError: (e) => {
                toast.error('La duplication a échoué', { description: e.message });
            },
        });
    };

    const remove = async (dpp: DppFormSummaryDto) => {
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

    return {
        open,
        duplicate,
        remove,
        editDraft,
        loadingId,
        isDuplicating: duplicateDpp.isPending,
        duplicatingId: duplicateDpp.isPending ? duplicateDpp.variables : undefined,
    };
}

interface DppRowActionsProps {
    dpp: DppFormSummaryDto;
    actions: ReturnType<typeof useDppActions>;
    className?: string;
}

export function DppRowActions({ dpp, actions, className }: DppRowActionsProps) {
    const isDraft = dpp.status === 'DRAFT';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size="icon"
                    variant="ghost"
                    className={className}
                    aria-label={`Actions pour ${dpp.productName ?? 'ce DPP'}`}
                >
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => actions.open(dpp)}>
                    <Eye className="h-3.5 w-3.5" /> Voir détail
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => actions.duplicate(dpp)} disabled={actions.isDuplicating}>
                    <Copy className="h-3.5 w-3.5" /> Dupliquer
                </DropdownMenuItem>
                {isDraft && (
                    <>
                        <DropdownMenuItem onClick={() => void actions.editDraft(dpp.id)}>
                            <Pencil className="h-3.5 w-3.5" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => void actions.remove(dpp)}>
                            <Trash2 className="h-3.5 w-3.5" /> Supprimer
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
