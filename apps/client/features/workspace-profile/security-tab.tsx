'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
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
import { Separator } from '@lumiris/ui/components/separator';
import { Switch } from '@lumiris/ui/components/switch';
import { toast } from '@lumiris/ui/components/sonner';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { isValidEmail, slugify } from './types';

export function SecurityTab() {
    const artisan = useCurrentArtisan();
    const defaultEmail = `${artisan.displayName.split(' ')[0]?.toLowerCase()}@${slugify(artisan.atelierName)}.fr`;

    const [recoveryEmail, setRecoveryEmail] = useState(defaultEmail);
    const [twoFA, setTwoFA] = useState(false);
    const [passwordOpen, setPasswordOpen] = useState(false);
    const [emailOpen, setEmailOpen] = useState(false);

    return (
        <div className="max-w-2xl space-y-4">
            <Section
                title="Mot de passe"
                description="Modifiable à tout moment. La nouvelle valeur prend effet immédiatement."
                action={
                    <Button variant="outline" size="sm" onClick={() => setPasswordOpen(true)}>
                        Changer
                    </Button>
                }
            />

            <Separator />

            <Section
                title="Authentification à deux facteurs (2FA)"
                description={
                    twoFA
                        ? 'Active — méthode : application authenticator'
                        : 'Inactive — recommandé pour les ateliers Studio et Maison.'
                }
                action={
                    <div className="flex items-center gap-2">
                        {twoFA && (
                            <Button variant="outline" size="sm" onClick={() => toast.info('Reconfiguration 2FA')}>
                                Reconfigurer
                            </Button>
                        )}
                        <Switch
                            checked={twoFA}
                            onCheckedChange={(v) => {
                                setTwoFA(v);
                                toast.success(v ? '2FA activée' : '2FA désactivée');
                            }}
                            aria-label="Activer la 2FA"
                        />
                    </div>
                }
            />

            <Separator />

            <Section
                title="Email de récupération"
                description={
                    <span className="text-foreground inline-flex items-center gap-1.5 font-mono text-xs">
                        <Mail className="text-muted-foreground h-3.5 w-3.5" />
                        {recoveryEmail}
                    </span>
                }
                action={
                    <Button variant="outline" size="sm" onClick={() => setEmailOpen(true)}>
                        Modifier
                    </Button>
                }
            />

            <PasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
            <RecoveryEmailDialog
                open={emailOpen}
                onOpenChange={setEmailOpen}
                current={recoveryEmail}
                onSave={(v) => {
                    setRecoveryEmail(v);
                    toast.success('Email de récupération mis à jour', {
                        description: 'Un code de vérification a été envoyé.',
                    });
                }}
            />
        </div>
    );
}

function Section({
    title,
    description,
    action,
}: {
    title: string;
    description: React.ReactNode;
    action: React.ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-4 py-2">
            <div className="space-y-1">
                <p className="text-sm font-medium">{title}</p>
                <div className="text-muted-foreground text-xs">{description}</div>
            </div>
            <div className="shrink-0">{action}</div>
        </div>
    );
}

function PasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');

    const handleSubmit = () => {
        if (!current || !next) return toast.error('Veuillez remplir tous les champs.');
        if (next !== confirm) return toast.error('Les mots de passe ne correspondent pas.');
        if (next.length < 8) return toast.error('Mot de passe trop court (8 caractères min).');
        toast.success('Mot de passe modifié');
        setCurrent('');
        setNext('');
        setConfirm('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Changer le mot de passe</DialogTitle>
                    <DialogDescription>Choisissez un mot de passe d&apos;au moins 8 caractères.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                    <Field id="pwd-cur" label="Mot de passe actuel" value={current} onChange={setCurrent} />
                    <Field id="pwd-new" label="Nouveau mot de passe" value={next} onChange={setNext} />
                    <Field id="pwd-cnf" label="Confirmation" value={confirm} onChange={setConfirm} />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Annuler
                    </Button>
                    <Button onClick={handleSubmit}>Mettre à jour</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function RecoveryEmailDialog({
    open,
    onOpenChange,
    current,
    onSave,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    current: string;
    onSave: (value: string) => void;
}) {
    const [value, setValue] = useState(current);

    const handleSubmit = () => {
        if (!isValidEmail(value)) return toast.error('Adresse e-mail invalide.');
        onSave(value.trim());
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Modifier l&apos;email de récupération</DialogTitle>
                    <DialogDescription>Un code de vérification sera envoyé à cette adresse.</DialogDescription>
                </DialogHeader>
                <div className="space-y-1.5 py-2">
                    <Label htmlFor="rec-email">Nouvelle adresse</Label>
                    <Input id="rec-email" type="email" value={value} onChange={(e) => setValue(e.target.value)} />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Annuler
                    </Button>
                    <Button onClick={handleSubmit}>Envoyer le code</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function Field({
    id,
    label,
    value,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            <Input id={id} type="password" value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
    );
}
