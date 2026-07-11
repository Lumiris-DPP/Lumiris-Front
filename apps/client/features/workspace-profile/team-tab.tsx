'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MoreVertical, Trash2, UserPlus, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@lumiris/ui/components/avatar';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@lumiris/ui/components/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { toast } from '@lumiris/ui/components/sonner';
import { formatDateFr } from '@lumiris/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { cn } from '@lumiris/ui/lib/cn';
import { useBilling } from '@/lib/billing-store';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { TIER_SEATS, type TeamMember, type TeamMemberRole, useTeam, useTeamStore } from '@/lib/team-mock';
import { DeleteMemberDialog } from './delete-member-dialog';
import { InviteDialog } from './invite-dialog';
import { initials } from './types';

export function TeamTab() {
    const artisan = useCurrentArtisan();
    const billing = useBilling(artisan.id);
    const team = useTeam(artisan.id);
    const ensureTeam = useTeamStore((s) => s.ensure);
    const changeRole = useTeamStore((s) => s.changeRole);

    useEffect(() => {
        if (billing.tier !== 'Solo') ensureTeam(artisan.id);
    }, [artisan.id, billing.tier, ensureTeam]);

    const [inviteOpen, setInviteOpen] = useState(false);
    const [confirmRemove, setConfirmRemove] = useState<TeamMember | null>(null);

    if (billing.tier === 'Solo') return <SoloUpsell />;

    const seats = TIER_SEATS[billing.tier];
    const used = team.length;
    const atSeatLimit = Number.isFinite(seats) && used >= seats;

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <h3 className="text-base font-medium">
                            Membres ({used} / {Number.isFinite(seats) ? seats : '∞'})
                        </h3>
                        <p className="text-muted-foreground text-xs">Palier {billing.tier}</p>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => setInviteOpen(true)}
                        disabled={atSeatLimit}
                        title={atSeatLimit ? 'Limite de sièges atteinte — voir Abonnement' : undefined}
                    >
                        <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                        Inviter
                    </Button>
                </div>

                <div className="border-border overflow-hidden rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Membre</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead className="hidden md:table-cell">Dernière activité</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {team.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="text-[10px]">
                                                    {initials(member.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">{member.name}</p>
                                                <p className="text-muted-foreground truncate font-mono text-xs">
                                                    {member.email}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <RoleCell
                                            member={member}
                                            onChange={(role) => {
                                                changeRole(artisan.id, member.id, role);
                                                toast.success(`Rôle modifié — ${role}`);
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell className="text-muted-foreground hidden text-xs md:table-cell">
                                        <span
                                            className={cn(
                                                'inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[10px] uppercase',
                                                member.status === 'active'
                                                    ? 'bg-lumiris-emerald/10 text-lumiris-emerald'
                                                    : 'bg-lumiris-amber/10 text-lumiris-amber',
                                            )}
                                        >
                                            {member.status}
                                        </span>
                                        <span className="ml-2">{formatDateFr(member.joinedAt)}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label={`Actions pour ${member.name}`}
                                                    disabled={member.role === 'owner'}
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onSelect={() => setConfirmRemove(member)}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                                    Supprimer
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <InviteDialog artisanId={artisan.id} open={inviteOpen} onOpenChange={setInviteOpen} />
            <DeleteMemberDialog artisanId={artisan.id} member={confirmRemove} onClose={() => setConfirmRemove(null)} />
        </>
    );
}

function RoleCell({ member, onChange }: { member: TeamMember; onChange: (role: TeamMemberRole) => void }) {
    if (member.role === 'owner') {
        return (
            <Badge variant="outline" className="font-mono uppercase">
                owner
            </Badge>
        );
    }
    return (
        <Select value={member.role} onValueChange={(v) => onChange(v as TeamMemberRole)}>
            <SelectTrigger className="h-8 w-28">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="editor">editor</SelectItem>
                <SelectItem value="viewer">viewer</SelectItem>
            </SelectContent>
        </Select>
    );
}

function SoloUpsell() {
    return (
        <div className="border-border max-w-2xl space-y-4 rounded-lg border p-6">
            <div className="flex items-center gap-2">
                <Users className="text-muted-foreground h-4 w-4" />
                <h3 className="text-base font-medium">Travaillez en équipe avec ATELIER Studio</h3>
            </div>
            <p className="text-muted-foreground text-sm">
                Votre plan Solo est conçu pour un artisan seul. Passez à Studio (79 €/mois) pour inviter jusqu&apos;à 5
                collaborateurs, ou à Maison (149 €/mois) pour les ateliers de 6 à 20 personnes.
            </p>
            <Button asChild>
                <Link href="/subscription">Comparer les plans</Link>
            </Button>
        </div>
    );
}
