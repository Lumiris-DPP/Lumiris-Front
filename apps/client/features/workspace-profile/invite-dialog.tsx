'use client';

import { useState } from 'react';
import { Button } from '@lumiris/ui/components/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@lumiris/ui/components/dialog';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { toast } from '@lumiris/ui/components/sonner';
import { type TeamMemberRole, useTeamStore } from '@/lib/team-mock';
import { isValidEmail } from './types';

interface InviteDialogProps {
    artisanId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function InviteDialog({ artisanId, open, onOpenChange }: InviteDialogProps) {
    const invite = useTeamStore((s) => s.invite);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<TeamMemberRole>('viewer');

    const handleSubmit = () => {
        if (!isValidEmail(email)) {
            toast.error('Adresse e-mail invalide');
            return;
        }
        invite(artisanId, email.trim(), role);
        toast.success('Invitation envoyée', { description: email.trim() });
        setEmail('');
        setRole('viewer');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Inviter un collaborateur</DialogTitle>
                    <DialogDescription>
                        Une invitation locale en statut « pending » sera créée. Aucun email réel n&apos;est envoyé.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="invite-email">Adresse e-mail</Label>
                        <Input
                            id="invite-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="prenom.nom@atelier.fr"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="invite-role">Rôle</Label>
                        <Select value={role} onValueChange={(v) => setRole(v as TeamMemberRole)}>
                            <SelectTrigger id="invite-role">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="editor">editor</SelectItem>
                                <SelectItem value="viewer">viewer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Annuler
                    </Button>
                    <Button onClick={handleSubmit}>Envoyer l&apos;invitation</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
