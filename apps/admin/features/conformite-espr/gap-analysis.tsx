'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Megaphone, PartyPopper, Send } from 'lucide-react';
import { EmptyState } from '../_shared/empty-state';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { Textarea } from '@lumiris/ui/components/textarea';
import { cn } from '@lumiris/ui/lib/cn';
import { useLogAction } from '@/lib/auth';
import { ACTION_LABEL, REASON_LABEL, type GapEntry, type RecommendedAction } from '@/lib/regulatory-calendar';

interface GapAnalysisProps {
    gaps: readonly GapEntry[];
    totalArtisans: number;
}

export function GapAnalysis({ gaps, totalArtisans }: GapAnalysisProps) {
    const router = useRouter();
    const [dialogOpen, setDialogOpen] = useState(false);
    return (
        <section className="rounded-xl border border-border bg-card">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border px-5 py-4">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">
                        Gap analysis · {gaps.length} / {totalArtisans}
                    </h3>
                </div>
                <Button
                    size="sm"
                    onClick={() => setDialogOpen(true)}
                    disabled={gaps.length === 0}
                    className="gap-1.5 bg-lumiris-cyan hover:bg-lumiris-cyan/90"
                >
                    <Megaphone className="h-3.5 w-3.5" /> Lancer campagne
                </Button>
            </div>

            {gaps.length === 0 ? (
                <div className="p-6">
                    <EmptyState icon={PartyPopper} title="Aucun gap." />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Atelier</TableHead>
                            <TableHead>Tier</TableHead>
                            <TableHead>Raisons du gap</TableHead>
                            <TableHead>Action recommandée</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {gaps.map((gap) => (
                            <TableRow
                                key={gap.artisanId}
                                tabIndex={0}
                                role="button"
                                aria-label={`Ouvrir l'atelier ${gap.artisanName}`}
                                onClick={() => router.push(`/artisans?id=${gap.artisanId}`)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        router.push(`/artisans?id=${gap.artisanId}`);
                                    }
                                }}
                                className="cursor-pointer hover:bg-muted/40"
                            >
                                <TableCell>
                                    <p className="text-sm text-foreground">{gap.artisanName}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                        {gap.city} · {gap.artisanId}
                                    </p>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="font-mono text-[10px]">
                                        {gap.tier}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {gap.reasons.map((reason) => (
                                            <Badge
                                                key={reason}
                                                variant="outline"
                                                className="border-lumiris-rose/40 font-mono text-[10px] text-lumiris-rose"
                                            >
                                                {REASON_LABEL[reason]}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-1.5 text-xs',
                                            actionTone(gap.recommendedAction),
                                        )}
                                    >
                                        <Send className="h-3 w-3" />
                                        {ACTION_LABEL[gap.recommendedAction]}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            <CampaignDialog open={dialogOpen} onOpenChange={setDialogOpen} gaps={gaps} />
        </section>
    );
}

function actionTone(action: RecommendedAction): string {
    switch (action) {
        case 'demo':
            return 'text-lumiris-cyan';
        case 'training':
            return 'text-lumiris-amber';
        case 'relance':
            return 'text-lumiris-emerald';
    }
}

function CampaignDialog({
    open,
    onOpenChange,
    gaps,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    gaps: readonly GapEntry[];
}) {
    const log = useLogAction();
    const [message, setMessage] = useState(
        "L'échéance ESPR textile arrive en 2028 — programmons un point pour finaliser votre DPP.",
    );

    const handleLaunch = () => {
        log({
            action: 'artisan.contact',
            targetType: 'period',
            targetId: `espr-campaign-${new Date().toISOString().slice(0, 10)}`,
            payload: {
                campaign: 'espr-activation',
                recipientCount: gaps.length,
                recipientIds: gaps.map((g) => g.artisanId),
                breakdown: gaps.reduce<Record<RecommendedAction, number>>(
                    (acc, g) => ({ ...acc, [g.recommendedAction]: (acc[g.recommendedAction] ?? 0) + 1 }),
                    { relance: 0, demo: 0, training: 0 },
                ),
                messagePreview: message.slice(0, 200),
                dryRun: true,
            },
        });
        onOpenChange(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Lancer la campagne</AlertDialogTitle>
                    <AlertDialogDescription>
                        Envoi groupé à {gaps.length} ateliers. Tracé dans l&apos;audit log.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-24"
                    placeholder="Message…"
                />
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleLaunch}
                        disabled={gaps.length === 0}
                        className="bg-lumiris-cyan hover:bg-lumiris-cyan/90"
                    >
                        Lancer · {gaps.length}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
