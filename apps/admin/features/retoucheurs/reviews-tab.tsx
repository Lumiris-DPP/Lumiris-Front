'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import type { Repairer } from '@lumiris/types';
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
import { Textarea } from '@lumiris/ui/components/textarea';
import { cn } from '@lumiris/ui/lib/cn';
import { useLogAction } from '@/lib/auth';
import { REVIEW_HIDE_REASON_MIN_CHARS } from './specialties';
import type { RetoucheurOverlay } from './types';

interface ReviewsTabProps {
    retoucheur: Repairer;
    overlay: RetoucheurOverlay | undefined;
    canModerate: boolean;
    onPatchOverlay: (id: string, patch: Partial<RetoucheurOverlay>) => void;
    onAnnounce: (message: string) => void;
}

export function ReviewsTab({ retoucheur, overlay, canModerate, onPatchOverlay, onAnnounce }: ReviewsTabProps) {
    const log = useLogAction();
    const [pendingHideId, setPendingHideId] = useState<string | null>(null);
    const [hideReason, setHideReason] = useState('');

    const fakeReviews = [
        { id: `${retoucheur.id}-rev-1`, author: 'Camille B.', rating: 5, ts: '2026-04-12', text: 'Travail soigné.' },
        { id: `${retoucheur.id}-rev-2`, author: 'Antoine D.', rating: 4, ts: '2026-03-20', text: 'Bon contact.' },
        { id: `${retoucheur.id}-rev-3`, author: 'Anonyme', rating: 1, ts: '2026-02-04', text: 'Texte abusif.' },
    ];

    const hidden = overlay?.hiddenReviewReasons ?? {};

    const close = () => {
        setPendingHideId(null);
        setHideReason('');
    };

    const handleHide = () => {
        if (pendingHideId === null || hideReason.trim().length < REVIEW_HIDE_REASON_MIN_CHARS) return;
        onPatchOverlay(retoucheur.id, {
            hiddenReviewReasons: { ...hidden, [pendingHideId]: hideReason.trim() },
        });
        const entry = log({
            action: 'retoucheur.review_hide',
            targetType: 'repairer',
            targetId: retoucheur.id,
            payload: { reviewId: pendingHideId, decision: 'hidden', reason: hideReason.trim() },
        });
        onAnnounce(`Avis masqué — audit log ${entry.id}.`);
        close();
    };

    const handlePublish = (reviewId: string) => {
        const next = { ...hidden };
        delete next[reviewId];
        onPatchOverlay(retoucheur.id, { hiddenReviewReasons: next });
        const entry = log({
            action: 'retoucheur.review_hide',
            targetType: 'repairer',
            targetId: retoucheur.id,
            payload: { reviewId, decision: 'published' },
        });
        onAnnounce(`Avis publié — audit log ${entry.id}.`);
    };

    return (
        <div className="space-y-2 text-xs">
            {fakeReviews.map((rev) => {
                const isHidden = rev.id in hidden;
                return (
                    <div
                        key={rev.id}
                        className={cn('border-border bg-card rounded-xl border p-3', isHidden && 'opacity-60')}
                    >
                        <div className="flex items-baseline justify-between">
                            <p className="text-foreground font-medium">{rev.author}</p>
                            <span className="font-mono text-[10px]">
                                <Star className="text-lumiris-amber inline h-3 w-3 fill-current" /> {rev.rating}/5 ·{' '}
                                {rev.ts}
                            </span>
                        </div>
                        <p className="text-foreground mt-1.5">{rev.text}</p>
                        {isHidden ? (
                            <div className="mt-2 space-y-1.5">
                                <p className="text-muted-foreground italic">Avis masqué — raison : {hidden[rev.id]}</p>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handlePublish(rev.id)}
                                    disabled={!canModerate}
                                    className="text-lumiris-emerald h-7 text-[11px]"
                                >
                                    Publier
                                </Button>
                            </div>
                        ) : (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setPendingHideId(rev.id)}
                                disabled={!canModerate}
                                className="text-lumiris-rose mt-2 h-7 text-[11px]"
                            >
                                Masquer
                            </Button>
                        )}
                    </div>
                );
            })}

            <AlertDialog open={pendingHideId !== null} onOpenChange={(open) => !open && close()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Masquer cet avis ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Précisez la raison (≥ {REVIEW_HIDE_REASON_MIN_CHARS} caractères). Action tracée.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                        value={hideReason}
                        onChange={(e) => setHideReason(e.target.value)}
                        placeholder="Raison du masquage"
                        className="min-h-20"
                    />
                    <p
                        className={cn(
                            'font-mono text-[10px]',
                            hideReason.trim().length < REVIEW_HIDE_REASON_MIN_CHARS
                                ? 'text-lumiris-rose'
                                : 'text-muted-foreground',
                        )}
                    >
                        {hideReason.trim().length}/{REVIEW_HIDE_REASON_MIN_CHARS}
                    </p>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleHide}
                            disabled={hideReason.trim().length < REVIEW_HIDE_REASON_MIN_CHARS}
                            className="bg-lumiris-rose hover:bg-lumiris-rose/90"
                        >
                            Masquer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
