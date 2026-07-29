'use client';

import { motion } from 'framer-motion';
import type { IrisGrade } from '@lumiris/types';
import { GRADE_LABEL } from '@lumiris/scoring-ui';
import { cn } from '@lumiris/ui/lib/cn';
import { GRADE_TEXT, GRADE_BORDER, GRADE_BG_SOFT, GRADE_CSS_VAR } from './grade-classes';

interface ScoreHeroProps {
    grade: IrisGrade;
    productName: string;
    brand: string;
    onOpenBreakdown: () => void;
}

export function ScoreHero({ grade, productName, brand, onOpenBreakdown }: ScoreHeroProps) {
    const cssVar = GRADE_CSS_VAR[grade];

    return (
        <header className="relative flex h-70 shrink-0 items-center justify-center overflow-hidden">
            <motion.div
                aria-hidden
                className="pointer-events-none absolute h-72 w-72 rounded-full blur-[80px]"
                style={{ background: cssVar }}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.3 }}
                transition={{ duration: 0.9, delay: 0.1 }}
            />

            <div className="relative z-10 flex flex-col items-center gap-3">
                <motion.button
                    type="button"
                    onClick={onOpenBreakdown}
                    aria-label={`Score Iris ${grade} - ouvrir le détail`}
                    className={cn(
                        'flex h-28 w-28 items-center justify-center rounded-full border-2 font-mono text-[64px] leading-none font-bold tracking-tight backdrop-blur-md transition active:scale-95',
                        GRADE_BORDER[grade],
                        GRADE_TEXT[grade],
                        GRADE_BG_SOFT[grade],
                    )}
                    style={{ boxShadow: `0 0 60px -10px ${cssVar}` }}
                    initial={{ scale: 0, rotate: -180, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.15 }}
                >
                    {grade}
                </motion.button>

                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.45 }}
                    className="flex flex-col items-center gap-0.5 text-center"
                >
                    <p className={cn('text-xs font-semibold tracking-[0.18em] uppercase', GRADE_TEXT[grade])}>
                        {GRADE_LABEL[grade]}
                    </p>
                    <p className="text-sm font-semibold text-foreground">{productName}</p>
                    <p className="text-xs text-muted-foreground">{brand}</p>
                </motion.div>
            </div>
        </header>
    );
}
