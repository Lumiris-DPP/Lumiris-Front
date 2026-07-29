'use client';

import { useEffect, useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import type { Artisan, ArtisanTier } from '@lumiris/types';
import { Button } from '@lumiris/ui/components/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@lumiris/ui/components/dialog';
import { Label } from '@lumiris/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { Textarea } from '@lumiris/ui/components/textarea';
import { useToast } from '@lumiris/ui/hooks/use-toast';
import { useLogAction, usePermission } from '@/lib/auth';

type ContactTemplateId = 'health-below-50' | 'capacity-upgrade' | 'capped-d-espr';

interface Template {
    id: ContactTemplateId;
    label: string;
    body: (artisan: Artisan, hintedTier: ArtisanTier | null) => string;
}

const FALLBACK_TEMPLATE: Template = {
    id: 'health-below-50',
    label: 'Santé < 50 — relance d’engagement',
    body: (a) =>
        `Bonjour ${a.displayName},\n\nNous constatons que l’activité de votre atelier ${a.atelierName} ralentit ces dernières semaines (santé compte sous le seuil de vigilance). Souhaitez-vous qu’on prévoie un point ensemble pour identifier les blocages et relancer la cadence de publication ?\n\nNous restons à votre écoute pour ajuster votre accompagnement.\n\nL’équipe LUMIRIS`,
};

const TEMPLATES: readonly Template[] = [
    FALLBACK_TEMPLATE,
    {
        id: 'capacity-upgrade',
        label: 'Capacité ≥ 80 % — proposition d’upgrade tier',
        body: (a, hinted) => {
            const target: ArtisanTier = hinted && hinted !== a.tier ? hinted : a.tier === 'Solo' ? 'Studio' : 'Maison';
            return `Bonjour ${a.displayName},\n\nVotre atelier ${a.atelierName} dépasse 80 % du plafond de votre offre ATELIER ${a.tier}. Pour éviter que les prochains passeports ne soient mis en attente, l’offre ATELIER ${target} vous laisserait davantage de marge — au même tarif par passeport.\n\nDites-nous si vous souhaitez basculer à la prochaine échéance ou organiser un échange.\n\nL’équipe LUMIRIS`;
        },
    },
    {
        id: 'capped-d-espr',
        label: 'Passeports plafonnés D — accompagnement conformité ESPR',
        body: (a) =>
            `Bonjour ${a.displayName},\n\nPlusieurs passeports de votre atelier ${a.atelierName} sont actuellement plafonnés au grade D faute d’un champ ESPR ou AGEC obligatoire (composition, étape de fabrication ou fiche entretien). Le registre DPP textile entre en vigueur le 19 juillet 2026 — nous voulons vous aider à compléter ces dossiers avant cette échéance.\n\nNotre équipe peut planifier un accompagnement pas à pas pour lever ces blocages. Dites-nous le créneau qui vous convient.\n\nL’équipe LUMIRIS`,
    },
] as const;

interface ContactDialogProps {
    artisan: Artisan;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    upgradeHint?: ArtisanTier | null;
}

export function ContactDialog({ artisan, open, onOpenChange, upgradeHint = null }: ContactDialogProps) {
    const log = useLogAction();
    const canContact = usePermission('artisan.contact');
    const { toast } = useToast();

    const defaultTemplateId: ContactTemplateId = upgradeHint ? 'capacity-upgrade' : 'health-below-50';
    const [templateId, setTemplateId] = useState<ContactTemplateId>(defaultTemplateId);

    const selectedTemplate = useMemo(
        () => TEMPLATES.find((t) => t.id === templateId) ?? FALLBACK_TEMPLATE,
        [templateId],
    );
    const [body, setBody] = useState(() => selectedTemplate.body(artisan, upgradeHint));

    useEffect(() => {
        if (!open) return;
        setTemplateId(defaultTemplateId);
    }, [open, defaultTemplateId]);

    useEffect(() => {
        setBody(selectedTemplate.body(artisan, upgradeHint));
    }, [selectedTemplate, artisan, upgradeHint]);

    const handleSend = () => {
        const trimmed = body.trim();
        if (trimmed.length === 0) return;
        log({
            action: 'artisan.contact',
            targetType: 'artisan',
            targetId: artisan.id,
            payload: { template: selectedTemplate.id, body: trimmed },
        });
        toast({
            title: `Message envoyé à ${artisan.displayName}`,
            description: `Modèle « ${selectedTemplate.label} » — entrée audit log écrite.`,
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Contacter {artisan.displayName}</DialogTitle>
                    <DialogDescription>
                        Choisissez un modèle d&apos;outreach, ajustez le message, puis envoyez.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="contact-template-select"
                            className="text-[11px] tracking-wider text-muted-foreground uppercase"
                        >
                            Modèle
                        </Label>
                        <Select value={templateId} onValueChange={(value) => setTemplateId(value as ContactTemplateId)}>
                            <SelectTrigger id="contact-template-select" aria-label="Choisir un modèle de message">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TEMPLATES.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label
                            htmlFor="contact-message-body"
                            className="text-[11px] tracking-wider text-muted-foreground uppercase"
                        >
                            Message final
                        </Label>
                        <Textarea
                            id="contact-message-body"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className="min-h-48 font-mono text-xs leading-relaxed"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Annuler
                    </Button>
                    <Button onClick={handleSend} disabled={!canContact || body.trim().length === 0} className="gap-1.5">
                        <Send className="h-3.5 w-3.5" aria-hidden /> Envoyer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
