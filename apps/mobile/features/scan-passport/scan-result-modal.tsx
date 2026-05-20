'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, RefreshCw, X } from 'lucide-react';
import { GRADE_LABEL, IrisGrade, gradeBackgroundSolid, gradeBorder2px } from '@lumiris/scoring-ui';
import type { Artisan, ExternalDpp, Passport, ScoreResult } from '@lumiris/types';
import { SPRING_OVERLAY } from '@/lib/motion';

interface LumirisVariant {
    kind: 'lumiris-passport';
    passport: Passport;
    artisan?: Artisan;
}

interface ExternalVariant {
    kind: 'external-dpp';
    dpp: ExternalDpp;
}

type ResultVariant = LumirisVariant | ExternalVariant;

interface ScanResultModalProps {
    result: ResultVariant;
    score: ScoreResult;
    onClose: () => void;
    onOpen: () => void;
}

export function ScanResultModal({ result, score, onClose, onOpen }: ScanResultModalProps) {
    const gradeBg = gradeBackgroundSolid(score.grade);
    const gradeLabel = GRADE_LABEL[score.grade];
    const gradeBorder2pxClass = gradeBorder2px(score.grade);

    const isExternal = result.kind === 'external-dpp';
    const layoutKey = isExternal ? `external-${result.dpp.gtin}` : `lumiris-${result.passport.id}`;

    const captionTop = isExternal ? `DPP détecté · ${result.dpp.emitter}` : 'Passeport détecté';
    const productLabel = isExternal ? result.dpp.productName : result.passport.garment.reference;
    const subLabel = isExternal
        ? `${result.dpp.brand}${result.dpp.origin?.country ? ` · ${result.dpp.origin.country}` : ''}`
        : `${result.artisan?.atelierName ?? '-'}${result.artisan?.city ? ` · ${result.artisan.city}` : ''}`;

    const ctaLabel = isExternal ? 'Voir le DPP' : 'Voir le passeport';

    return (
        <AnimatePresence>
            <motion.div
                key="scan-result"
                className="absolute inset-0 z-40 flex items-end justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                <motion.div
                    className="pointer-events-none absolute inset-0 motion-reduce:hidden"
                    style={{
                        background:
                            'radial-gradient(circle at 50% 50%, oklch(60% 0.13 195deg / 35%), oklch(55% 0.18 160deg / 20%), transparent 70%)',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.9, 0] }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    aria-hidden
                />

                <button
                    type="button"
                    className="bg-background/60 absolute inset-0 backdrop-blur-md"
                    onClick={onClose}
                    aria-label="Fermer"
                />

                <motion.div
                    layoutId={`scan-result-${layoutKey}`}
                    className="border-border/50 bg-card/95 relative flex max-h-[70vh] w-full max-w-md flex-col gap-5 rounded-t-3xl border-x border-t p-6 pb-8 shadow-2xl backdrop-blur-2xl"
                    role="dialog"
                    aria-label={isExternal ? 'DPP détecté' : 'Passeport détecté'}
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={SPRING_OVERLAY}
                >
                    <div
                        className="bg-border/60 absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full"
                        aria-hidden
                    />

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fermer"
                        className="border-border/60 bg-card text-foreground absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>

                    <div className="flex flex-col items-center gap-3 pt-2">
                        <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-[0.2em]">
                            {captionTop}
                        </p>
                        <div className="relative h-24 w-24">
                            <span
                                className={`absolute inset-0 -z-10 rounded-full opacity-50 blur-2xl ${gradeBg}`}
                                aria-hidden
                            />
                            <IrisGrade
                                grade={score.grade}
                                size="xl"
                                tone="solid"
                                shape="pill"
                                className={`h-24! w-24! shadow-xl ${gradeBorder2pxClass}`}
                            />
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                            <p className="text-foreground text-center text-base font-semibold">{productLabel}</p>
                            <p className="text-muted-foreground text-center text-xs">{subLabel}</p>
                            <p className="text-muted-foreground/80 mt-1 text-[11px] font-medium uppercase tracking-[0.15em]">
                                {gradeLabel}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={onOpen}
                            className="bg-foreground text-primary-foreground inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold"
                        >
                            {ctaLabel}
                            <ArrowRight className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="border-border/60 bg-card text-foreground inline-flex w-full items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-medium"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Scanner un autre
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
