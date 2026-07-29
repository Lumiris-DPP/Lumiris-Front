'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Bell, CreditCard, FileText } from 'lucide-react';
import { mockPaymentHistory } from '@lumiris/mock-data';
import type { Subscription } from '@lumiris/types';
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
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { DetailDrawer } from '@lumiris/ui/components/detail-drawer';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { useLogAction, usePermission } from '@/lib/auth';
import { PRICE_LINES, formatEur } from '@/lib/pricing';
import { PermissionRequiredAction } from '../_shared/permission-required-action';
import { openInvoiceWindow } from './print-invoice';
import { statusBadgeProps } from './status';

interface Props {
    subscription: Subscription | null;
    onClose: () => void;
}

export function SubscriptionDetailDrawer({ subscription, onClose }: Props) {
    if (!subscription) return <DetailDrawer open={false} onOpenChange={onClose} title="" />;
    return <DetailDrawerBody subscription={subscription} onClose={onClose} />;
}

function DetailDrawerBody({ subscription: sub, onClose }: { subscription: Subscription; onClose: () => void }) {
    const log = useLogAction();
    const canDun = usePermission('billing.dunning');
    const canIssueInvoice = usePermission('billing.invoice_issue');
    const [dunningOpen, setDunningOpen] = useState(false);
    const [typed, setTyped] = useState('');
    const [dunned, setDunned] = useState(false);
    const [invoiced, setInvoiced] = useState(false);

    const invoices = useMemo(() => mockPaymentHistory.filter((p) => p.subscriptionId === sub.id).slice(0, 6), [sub.id]);

    const planLabel =
        sub.subscriberKind === 'artisan'
            ? `ATELIER ${sub.artisanTier ?? sub.tier}${sub.plus ? ' + ATELIER+' : ''}`
            : PRICE_LINES.local.label;
    const status = statusBadgeProps(sub.status);
    const fr = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');

    const detailRows: ReadonlyArray<{ label: string; value: ReactNode; mono?: boolean }> = [
        { label: 'Plan', value: planLabel },
        { label: 'MRR', value: formatEur(sub.mrrEur), mono: true },
        {
            label: 'Statut',
            value: (
                <Badge variant={status.variant} className={`font-mono text-[10px] ${status.className}`}>
                    {status.label}
                </Badge>
            ),
        },
        { label: 'Prochaine échéance', value: fr(sub.nextBillingAt), mono: true },
        { label: 'Dernier prélèvement', value: sub.lastChargeAt ? fr(sub.lastChargeAt) : '—', mono: true },
        {
            label: 'Moyen de paiement',
            value: (
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                    <CreditCard className="h-3 w-3" />
                    {sub.paymentMethod.brand.toUpperCase()} ····{sub.paymentMethod.last4}
                </span>
            ),
        },
        { label: 'Ville', value: sub.city },
        { label: 'Compte', value: sub.subscriberId, mono: true },
    ];

    function handleDunning() {
        log({
            action: 'billing.dunning',
            targetType: 'subscription',
            targetId: sub.id,
            payload: { tier: sub.tier, mrr: sub.mrrEur, attemptNumber: (sub.dunningAttempts ?? 0) + 1 },
        });
        setDunned(true);
        setDunningOpen(false);
        setTyped('');
    }

    function handleInvoice() {
        log({
            action: 'billing.invoice_issue',
            targetType: 'subscription',
            targetId: sub.id,
            payload: { tier: sub.tier, plus: sub.plus, mrr: sub.mrrEur, kind: sub.subscriberKind },
        });
        setInvoiced(true);
        if (typeof window !== 'undefined') openInvoiceWindow(sub);
    }

    const infosTab = (
        <div className="grid grid-cols-2 gap-3 text-sm">
            {detailRows.map((row) => (
                <div key={row.label} className="flex flex-col gap-0.5">
                    <span className="text-[10px] tracking-wider text-muted-foreground uppercase">{row.label}</span>
                    <span className={row.mono ? 'font-mono text-sm text-foreground' : 'text-sm text-foreground'}>
                        {row.value}
                    </span>
                </div>
            ))}
        </div>
    );

    const invoicesTab =
        invoices.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Aucun prélèvement enregistré.</p>
        ) : (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-[11px]">Date</TableHead>
                        <TableHead className="text-right text-[11px]">Montant</TableHead>
                        <TableHead className="text-[11px]">Statut</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.map((p) => {
                        const s = statusBadgeProps(p.status);
                        return (
                            <TableRow key={p.id}>
                                <TableCell className="font-mono text-[11px]">{fr(p.chargedAt)}</TableCell>
                                <TableCell className="text-right font-mono text-[11px]">
                                    {formatEur(p.amountEur)}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={s.variant} className={`font-mono text-[10px] ${s.className}`}>
                                        {s.label}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        );

    return (
        <>
            <DetailDrawer
                open
                onOpenChange={(o) => !o && onClose()}
                title={sub.displayName}
                subtitle={`${sub.subscriberKind === 'artisan' ? 'Artisan' : 'Retoucheur'} · ${sub.city}`}
                tabs={[
                    { value: 'infos', label: 'Infos', content: infosTab },
                    { value: 'invoices', label: `Factures (${invoices.length})`, content: invoicesTab },
                ]}
                footer={
                    <div className="flex flex-wrap justify-end gap-2">
                        {sub.status === 'past_due' ? (
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={!canDun || dunned}
                                onClick={() => setDunningOpen(true)}
                                className="gap-1.5"
                            >
                                <Bell className="h-3 w-3" /> {dunned ? 'Relancé' : 'Relancer'}
                            </Button>
                        ) : null}
                        <Button
                            size="sm"
                            disabled={!canIssueInvoice || sub.tier === 'free'}
                            onClick={handleInvoice}
                            className="gap-1.5"
                        >
                            <FileText className="h-3 w-3" /> {invoiced ? 'Re-générer facture' : 'Générer facture'}
                        </Button>
                    </div>
                }
            />
            <AlertDialog
                open={dunningOpen}
                onOpenChange={(o) => {
                    setDunningOpen(o);
                    if (!o) setTyped('');
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Relancer {sub.displayName} ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tentative n°{(sub.dunningAttempts ?? 0) + 1}. Action audit-loguée + email au compte facturé.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-1.5">
                        <Label htmlFor="dunning-typed-name" className="text-[11px]">
                            Tapez le nom exact : <span className="font-mono text-foreground">{sub.displayName}</span>
                        </Label>
                        <Input
                            id="dunning-typed-name"
                            value={typed}
                            onChange={(e) => setTyped(e.target.value)}
                            placeholder={sub.displayName}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <PermissionRequiredAction requires="billing.dunning">
                            <AlertDialogAction
                                disabled={!canDun || typed.trim() !== sub.displayName}
                                onClick={handleDunning}
                            >
                                Envoyer la relance
                            </AlertDialogAction>
                        </PermissionRequiredAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
