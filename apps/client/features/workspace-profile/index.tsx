'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, ImagePlus, Mail, ShieldAlert, Trash2, UserPlus, Users, X } from 'lucide-react';
import { toast } from '@lumiris/ui/components/sonner';
import type { Artisan, FrenchRegion } from '@lumiris/types';
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
import { Avatar, AvatarFallback } from '@lumiris/ui/components/avatar';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
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
import { Switch } from '@lumiris/ui/components/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { Textarea } from '@lumiris/ui/components/textarea';
import { cn } from '@lumiris/ui/lib/cn';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { useBilling } from '@/lib/billing-store';
import { type ProfileSnapshot, useProfile, useProfileStore } from '@/lib/profile-store';
import { TIER_SEATS, type TeamMember, type TeamMemberRole, useTeam, useTeamStore } from '@/lib/team-mock';

const FRENCH_REGIONS: readonly FrenchRegion[] = [
    'Auvergne-Rhône-Alpes',
    'Bourgogne-Franche-Comté',
    'Bretagne',
    'Centre-Val de Loire',
    'Corse',
    'Grand Est',
    'Hauts-de-France',
    'Île-de-France',
    'Normandie',
    'Nouvelle-Aquitaine',
    'Occitanie',
    'Pays de la Loire',
    "Provence-Alpes-Côte d'Azur",
];

export function WorkspaceProfile() {
    const artisan = useCurrentArtisan();
    return (
        <div className="space-y-6 p-4 md:p-8">
            <ProfileEditor artisan={artisan} />
            <SecuritySection artisan={artisan} />
            <TeamSection artisanId={artisan.id} />
        </div>
    );
}

function ProfileEditor({ artisan }: { artisan: Artisan }) {
    const persisted = useProfile(artisan.id);
    const setOverride = useProfileStore((s) => s.setOverride);
    const resetOverride = useProfileStore((s) => s.resetOverride);

    const [draft, setDraft] = useState<ProfileSnapshot>(persisted);
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        setDraft(persisted);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [artisan.id]);

    const dirty = useMemo(() => !shallowEqualProfile(draft, persisted), [draft, persisted]);

    const handlePhoto = (file: File | undefined) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') setDraft((d) => ({ ...d, photoUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const addTag = () => {
        const t = tagInput.trim();
        if (!t || draft.specialities.includes(t)) return;
        setDraft((d) => ({ ...d, specialities: [...d.specialities, t] }));
        setTagInput('');
    };

    const removeTag = (t: string) => {
        setDraft((d) => ({ ...d, specialities: d.specialities.filter((s) => s !== t) }));
    };

    const onSave = () => {
        setOverride(artisan.id, {
            story: draft.story,
            city: draft.city,
            region: draft.region,
            specialities: draft.specialities,
            photoUrl: draft.photoUrl,
            epvLabeled: draft.epvLabeled,
            ofgLabeled: draft.ofgLabeled,
        });
        toast.success('Profil enregistré', { description: artisan.atelierName });
    };

    const onCancel = () => {
        setDraft(persisted);
    };

    const onReset = () => {
        resetOverride(artisan.id);
        toast.info('Profil réinitialisé sur les valeurs par défaut');
    };

    return (
        <div className="space-y-4">
            <div className="bg-card border-border sticky top-16 z-10 flex flex-col gap-3 rounded-xl border p-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                    {dirty ? (
                        <Badge className="bg-lumiris-amber/10 text-lumiris-amber border-lumiris-amber/30 gap-1.5">
                            <AlertCircle className="h-3 w-3" />
                            Modifications non enregistrées
                        </Badge>
                    ) : (
                        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                            <CheckCircle2 className="text-lumiris-emerald h-3.5 w-3.5" />
                            Enregistré
                        </span>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={onReset} type="button">
                        Valeurs par défaut
                    </Button>
                    <Button variant="outline" size="sm" onClick={onCancel} type="button" disabled={!dirty}>
                        Annuler
                    </Button>
                    <Button size="sm" onClick={onSave} type="button" disabled={!dirty}>
                        Enregistrer
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Photo atelier</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <label className="border-border bg-muted/40 hover:bg-muted relative flex h-44 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed">
                            {draft.photoUrl ? (
                                <Image
                                    src={draft.photoUrl}
                                    alt="Aperçu de la photo de l'atelier"
                                    fill
                                    sizes="280px"
                                    unoptimized
                                    className="object-cover"
                                />
                            ) : (
                                <>
                                    <ImagePlus className="text-muted-foreground mb-2 h-6 w-6" />
                                    <p className="text-muted-foreground text-xs">Cliquez pour importer</p>
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                aria-label="Importer la photo de l'atelier"
                                className="absolute inset-0 cursor-pointer opacity-0"
                                onChange={(e) => handlePhoto(e.target.files?.[0])}
                            />
                        </label>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Identité atelier</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label>Nom artisan</Label>
                                <Input value={artisan.displayName} disabled />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Atelier</Label>
                                <Input value={artisan.atelierName} disabled />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="city">Ville</Label>
                                <Input
                                    id="city"
                                    value={draft.city}
                                    onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="region">Région</Label>
                                <Select
                                    value={draft.region}
                                    onValueChange={(v) => setDraft((d) => ({ ...d, region: v as FrenchRegion }))}
                                >
                                    <SelectTrigger id="region">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FRENCH_REGIONS.map((r) => (
                                            <SelectItem key={r} value={r}>
                                                {r}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <Label htmlFor="story">Histoire de l’atelier (markdown léger)</Label>
                                <Textarea
                                    id="story"
                                    rows={6}
                                    value={draft.story}
                                    onChange={(e) => setDraft((d) => ({ ...d, story: e.target.value }))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Spécialités</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex flex-wrap gap-1.5">
                                {draft.specialities.length === 0 && (
                                    <p className="text-muted-foreground text-xs">Aucune spécialité renseignée.</p>
                                )}
                                {draft.specialities.map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        className="bg-lumiris-emerald/10 text-lumiris-emerald inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs"
                                        onClick={() => removeTag(t)}
                                        aria-label={`Retirer ${t}`}
                                    >
                                        {t} <X className="h-3 w-3" />
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    placeholder="Ex. tissage main"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addTag();
                                        }
                                    }}
                                />
                                <Button variant="outline" onClick={addTag} type="button">
                                    Ajouter
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Labels métier</CardTitle>
                            <p className="text-muted-foreground text-xs">
                                EPV et OFG influencent le sous-score Savoir-faire (axe 25%).
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <ToggleRow
                                label="EPV (Entreprise du Patrimoine Vivant)"
                                checked={draft.epvLabeled}
                                onChange={(v) => setDraft((d) => ({ ...d, epvLabeled: v }))}
                            />
                            <ToggleRow
                                label="OFG (Origine France Garantie)"
                                checked={draft.ofgLabeled}
                                onChange={(v) => setDraft((d) => ({ ...d, ofgLabeled: v }))}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function SecuritySection({ artisan }: { artisan: Artisan }) {
    const billing = useBilling(artisan.id);
    const email = `${artisan.displayName.split(' ')[0]?.toLowerCase()}@${slugDomain(artisan.atelierName)}.fr`;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="text-muted-foreground h-4 w-4" />
                    Sécurité
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label>Adresse e-mail</Label>
                        <div className="border-input bg-muted/30 flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                            <Mail className="text-muted-foreground h-4 w-4" />
                            <span className="font-mono text-xs">{email}</span>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Palier en cours</Label>
                        <div className="border-input bg-muted/30 flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                            <span className="font-medium">{billing.tier}</span>
                            {billing.atelierPlus && (
                                <Badge className="bg-lumiris-amber/10 text-lumiris-amber border-lumiris-amber/30 ml-auto">
                                    ATELIER+
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
                <p className="text-muted-foreground border-lumiris-amber/30 bg-lumiris-amber/5 rounded-md border-l-2 px-3 py-2 text-xs">
                    Authentification de démonstration — l’email et le mot de passe ne peuvent pas être modifiés dans
                    cette version mock.
                </p>
            </CardContent>
        </Card>
    );
}

function TeamSection({ artisanId }: { artisanId: string }) {
    const billing = useBilling(artisanId);
    const team = useTeam(artisanId);
    const ensureTeam = useTeamStore((s) => s.ensure);
    const invite = useTeamStore((s) => s.invite);
    const changeRole = useTeamStore((s) => s.changeRole);
    const remove = useTeamStore((s) => s.remove);

    useEffect(() => {
        if (billing.tier !== 'Solo') ensureTeam(artisanId);
    }, [artisanId, billing.tier, ensureTeam]);

    const [inviteOpen, setInviteOpen] = useState(false);
    const [confirmRemove, setConfirmRemove] = useState<TeamMember | null>(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<TeamMemberRole>('viewer');

    if (billing.tier === 'Solo') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="text-muted-foreground h-4 w-4" />
                        Travaillez en équipe avec ATELIER Studio
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground text-sm">
                        Votre plan Solo est conçu pour un artisan seul. Passez à Studio (79 €/mois) pour inviter jusqu’à
                        5 collaborateurs et créer des passeports à plusieurs sur des plans 2-5 personnes, ou à Maison
                        (149 €/mois) pour les ateliers de 6 à 20 personnes.
                    </p>
                    <ul className="text-foreground space-y-1.5 text-sm">
                        <li className="flex items-start gap-2">
                            <span className="text-muted-foreground" aria-hidden="true">
                                •
                            </span>
                            Comptes dédiés par collaborateur
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-muted-foreground" aria-hidden="true">
                                •
                            </span>
                            Rôles owner / éditeur / lecteur
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-muted-foreground" aria-hidden="true">
                                •
                            </span>
                            Suivi des contributions par membre
                        </li>
                    </ul>
                    <div className="space-y-2">
                        <Button asChild>
                            <Link href="/subscription">Comparer les plans</Link>
                        </Button>
                        <p className="text-muted-foreground text-xs">
                            Vous restez sur Solo et changez d’avis plus tard, sans perdre vos passeports.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const seats = TIER_SEATS[billing.tier];
    const used = team.length;

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="text-muted-foreground h-4 w-4" />
                            Équipe
                        </CardTitle>
                        <p className="text-muted-foreground mt-1 text-xs">
                            {used} / {Number.isFinite(seats) ? seats : '∞'} sièges utilisés sur le palier {billing.tier}
                            .
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setInviteEmail('');
                            setInviteRole('viewer');
                            setInviteOpen(true);
                        }}
                        disabled={Number.isFinite(seats) && used >= seats}
                    >
                        <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                        Inviter
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-15" />
                                <TableHead>Nom</TableHead>
                                <TableHead className="hidden md:table-cell">Email</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead className="hidden md:table-cell">Arrivée</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {team.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="text-[10px]">
                                                {initials(member.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell className="font-medium">{member.name}</TableCell>
                                    <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                                        {member.email}
                                    </TableCell>
                                    <TableCell>
                                        {member.role === 'owner' ? (
                                            <Badge variant="outline" className="font-mono uppercase">
                                                owner
                                            </Badge>
                                        ) : (
                                            <Select
                                                value={member.role}
                                                onValueChange={(v) => {
                                                    changeRole(artisanId, member.id, v as TeamMemberRole);
                                                    toast.success(`Rôle modifié — ${v}`);
                                                }}
                                            >
                                                <SelectTrigger className="h-8 w-28">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="editor">editor</SelectItem>
                                                    <SelectItem value="viewer">viewer</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground hidden text-xs md:table-cell">
                                        {new Date(member.joinedAt).toLocaleDateString('fr-FR')}
                                    </TableCell>
                                    <TableCell>
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
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setConfirmRemove(member)}
                                            disabled={member.role === 'owner'}
                                            aria-label={`Retirer ${member.name}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Inviter un collaborateur</DialogTitle>
                        <DialogDescription>
                            Une invitation locale en statut « pending » sera ajoutée. Aucun email réel n’est envoyé.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="invite-email">Adresse e-mail</Label>
                            <Input
                                id="invite-email"
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="prenom.nom@atelier.fr"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="invite-role">Rôle</Label>
                            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as TeamMemberRole)}>
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
                        <Button variant="outline" onClick={() => setInviteOpen(false)}>
                            Annuler
                        </Button>
                        <Button
                            onClick={() => {
                                if (!isValidEmail(inviteEmail)) {
                                    toast.error('Adresse e-mail invalide');
                                    return;
                                }
                                invite(artisanId, inviteEmail.trim(), inviteRole);
                                setInviteOpen(false);
                                toast.success('Invitation enregistrée', { description: inviteEmail.trim() });
                            }}
                        >
                            Inviter
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!confirmRemove} onOpenChange={(o) => !o && setConfirmRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Retirer {confirmRemove?.name} ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Le collaborateur perdra l’accès au workspace de cet atelier. Vous pourrez le réinviter plus
                            tard.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (confirmRemove) {
                                    remove(artisanId, confirmRemove.id);
                                    toast.success(`${confirmRemove.name} a été retiré·e`);
                                }
                                setConfirmRemove(null);
                            }}
                        >
                            Retirer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="border-border bg-card flex items-center justify-between rounded-md border p-3">
            <span className="text-foreground text-sm">{label}</span>
            <Switch checked={checked} onCheckedChange={onChange} />
        </label>
    );
}

function shallowEqualProfile(a: ProfileSnapshot, b: ProfileSnapshot): boolean {
    if (a === b) return true;
    if (a.story !== b.story) return false;
    if (a.city !== b.city) return false;
    if (a.region !== b.region) return false;
    if (a.photoUrl !== b.photoUrl) return false;
    if (a.epvLabeled !== b.epvLabeled) return false;
    if (a.ofgLabeled !== b.ofgLabeled) return false;
    if (a.specialities.length !== b.specialities.length) return false;
    for (let i = 0; i < a.specialities.length; i++) {
        if (a.specialities[i] !== b.specialities[i]) return false;
    }
    return true;
}

function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function slugDomain(s: string): string {
    return s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function isValidEmail(s: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}
