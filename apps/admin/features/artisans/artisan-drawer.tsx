'use client';

import { useEffect, useState } from 'react';
import { PauseCircle } from 'lucide-react';
import { mockAdminAuditLog, mockPassports, mockRepairers } from '@lumiris/mock-data';
import type { Artisan } from '@lumiris/types';
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
import { Button } from '@lumiris/ui/components/button';
import { Checkbox } from '@lumiris/ui/components/checkbox';
import { DetailDrawer } from '@lumiris/ui/components/detail-drawer';
import { Textarea } from '@lumiris/ui/components/textarea';
import { useAdminAuditLog, useLogAction, usePermission } from '@/lib/auth';
import { buildArtisanRow } from '@/lib/artisan-analytics';
import { ContactDialog } from './contact-dialog';
import { ActionsTab, PassportsTab, SynthesisTab } from './drawer-tabs';
import { FIXTURE_NOW } from '@/lib/fixture-clock';

interface ArtisanDrawerProps {
    artisan: Artisan | null;
    onClose: () => void;
}

export function ArtisanDrawer({ artisan, onClose }: ArtisanDrawerProps) {
    const log = useLogAction();
    const auditLog = useAdminAuditLog();
    const canSuspend = usePermission('artisan.suspend');
    const canContact = usePermission('artisan.contact');
    const canDunning = usePermission('billing.dunning');

    const [suspendOpen, setSuspendOpen] = useState(false);
    const [suspendReason, setSuspendReason] = useState('');
    const [suspendConfirmed, setSuspendConfirmed] = useState(false);
    const [contactOpen, setContactOpen] = useState(false);

    useEffect(() => {
        if (!suspendOpen) {
            setSuspendReason('');
            setSuspendConfirmed(false);
        }
    }, [suspendOpen]);

    if (!artisan) return null;

    const passports = mockPassports.filter((p) => p.artisanId === artisan.id);
    const combinedAuditLog = [...auditLog, ...mockAdminAuditLog];
    const row = buildArtisanRow(artisan, mockPassports, mockRepairers, combinedAuditLog, FIXTURE_NOW);

    const handleSuspend = () => {
        if (!suspendConfirmed) return;
        log({
            action: 'artisan.suspend',
            targetType: 'artisan',
            targetId: artisan.id,
            payload: { reason: suspendReason },
        });
        setSuspendOpen(false);
    };

    const handleDunning = () => {
        log({
            action: 'billing.dunning',
            targetType: 'artisan',
            targetId: artisan.id,
            payload: { stage: 'reminder-1', triggeredFrom: 'artisans-module' },
        });
    };

    return (
        <>
            <DetailDrawer
                open
                onOpenChange={(open) => !open && onClose()}
                title={artisan.atelierName}
                subtitle={`${artisan.displayName} · ${artisan.city} · ${artisan.region}`}
                width="md"
                tabs={[
                    {
                        value: 'synthesis',
                        label: 'Synthèse',
                        content: <SynthesisTab artisan={artisan} row={row} auditLog={combinedAuditLog} />,
                    },
                    {
                        value: 'passports',
                        label: `Passeports (${passports.length})`,
                        content: <PassportsTab artisan={artisan} />,
                    },
                    {
                        value: 'actions',
                        label: 'Actions',
                        content: (
                            <ActionsTab
                                artisan={artisan}
                                canContact={canContact}
                                canDunning={canDunning}
                                onContact={() => setContactOpen(true)}
                                onDunning={handleDunning}
                            />
                        ),
                    },
                ]}
                footer={
                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSuspendOpen(true)}
                            disabled={!canSuspend}
                            className="gap-1.5 border-lumiris-rose/40 text-lumiris-rose hover:bg-lumiris-rose/10"
                        >
                            <PauseCircle className="h-3.5 w-3.5" /> Suspendre
                        </Button>
                        <Button size="sm" variant="ghost" onClick={onClose} className="ml-auto">
                            Fermer
                        </Button>
                    </div>
                }
            />

            <AlertDialog open={suspendOpen} onOpenChange={setSuspendOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Suspendre {artisan.atelierName} ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Passeports actifs archivés. Tracé dans l&apos;audit log.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                        value={suspendReason}
                        onChange={(e) => setSuspendReason(e.target.value)}
                        placeholder="Motif"
                        className="min-h-20"
                    />
                    <div className="flex items-center gap-2 text-xs">
                        <Checkbox
                            id="suspend-confirm"
                            checked={suspendConfirmed}
                            onCheckedChange={(v) => setSuspendConfirmed(v === true)}
                        />
                        <label htmlFor="suspend-confirm" className="cursor-pointer text-foreground">
                            Je confirme — l&apos;action est tracée
                        </label>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleSuspend}
                            disabled={!suspendConfirmed}
                            className="bg-lumiris-rose hover:bg-lumiris-rose/90"
                        >
                            Suspendre
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <ContactDialog
                artisan={artisan}
                open={contactOpen}
                onOpenChange={setContactOpen}
                upgradeHint={row.upgradeHint}
            />
        </>
    );
}
