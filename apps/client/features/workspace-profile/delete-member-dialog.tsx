'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@lumiris/ui/components/alert-dialog';
import { toast } from '@lumiris/ui/components/sonner';
import { type TeamMember, useTeamStore } from '@/lib/team-mock';

interface DeleteMemberDialogProps {
    artisanId: string;
    member: TeamMember | null;
    onClose: () => void;
}

export function DeleteMemberDialog({ artisanId, member, onClose }: DeleteMemberDialogProps) {
    const remove = useTeamStore((s) => s.remove);

    return (
        <AlertDialog open={!!member} onOpenChange={(o) => !o && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Retirer {member?.name} ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Le collaborateur perdra l&apos;accès au workspace de cet atelier. Cette action est irréversible
                        — vous pourrez le réinviter plus tard.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => {
                            if (member) {
                                remove(artisanId, member.id);
                                toast.success(`${member.name} a été retiré·e`);
                            }
                            onClose();
                        }}
                    >
                        Retirer
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
