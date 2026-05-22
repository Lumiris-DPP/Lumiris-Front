'use client';

import { GRADE_LABEL, IrisGrade } from '@lumiris/scoring-ui';
import type { Artisan, Passport, ScoreResult } from '@lumiris/types';
import { Sheet, SheetContent, SheetTitle } from '@lumiris/ui/components/sheet';

interface ScanResultModalProps {
    passport: Passport;
    artisan?: Artisan;
    score: ScoreResult;
    onClose: () => void;
    onOpen: () => void;
}

export function ScanResultModal({ passport, artisan, score, onClose, onOpen }: ScanResultModalProps) {
    const subLabel = `${artisan?.atelierName ?? '—'}${artisan?.city ? ` · ${artisan.city}` : ''}`;
    return (
        <Sheet defaultOpen onOpenChange={(open) => (open ? null : onClose())}>
            <SheetContent
                side="bottom"
                className="max-h-[60vh] rounded-t-3xl px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-8"
            >
                <SheetTitle className="sr-only">Passeport détecté</SheetTitle>
                <div className="flex flex-col items-center gap-5">
                    <IrisGrade grade={score.grade} size="xl" tone="solid" shape="pill" />
                    <div className="flex flex-col items-center gap-1 text-center">
                        <p className="text-foreground text-base font-semibold">{passport.garment.reference}</p>
                        <p className="text-muted-foreground text-sm">{subLabel}</p>
                        <p className="text-muted-foreground/80 text-sm">{GRADE_LABEL[score.grade]}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onOpen}
                        className="bg-foreground text-background hover:bg-foreground/90 inline-flex h-14 w-full items-center justify-center rounded-2xl text-sm font-semibold"
                    >
                        Ouvrir le passeport
                    </button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
