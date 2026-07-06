'use client';

import type { ScoreResult } from '@lumiris/types';
import { IrisGrade, ScoreBreakdown } from '@lumiris/scoring-ui';
import { Card, CardContent } from '@lumiris/ui/components/card';

const FIXED_SCORE: ScoreResult = {
    total: 42,
    grade: 'C',
    breakdown: { transparency: 18, craftsmanship: 10, impact: 10, repairability: 4 },
    weights: { transparency: 0.4, craftsmanship: 0.25, impact: 0.25, repairability: 0.1 },
    reasons: [],
};

export function ScoreSidebar() {
    const score = FIXED_SCORE;

    return (
        <>
            <aside className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
                <Card>
                    <CardContent className="space-y-4 p-4">
                        <ScoreHeader score={score} />
                        <ScoreBreakdown breakdown={score.breakdown} weights={score.weights} />
                    </CardContent>
                </Card>
            </aside>
            <MobileScoreStrip score={score} />
        </>
    );
}

function ScoreHeader({ score }: { score: ScoreResult }) {
    return (
        <div className="flex items-center gap-3">
            <IrisGrade grade={score.grade} size="lg" />
            <div>
                <p className="text-foreground font-mono text-2xl font-semibold leading-none">
                    {score.total.toFixed(1)}
                    <span className="text-muted-foreground/70 ml-0.5 text-sm font-normal">/ 100</span>
                </p>
                <p className="text-muted-foreground mt-1 text-[11px]">Score Iris provisoire</p>
            </div>
        </div>
    );
}

function MobileScoreStrip({ score }: { score: ScoreResult }) {
    return (
        <div className="border-border bg-card flex items-center gap-3 rounded-lg border px-3 py-2 lg:hidden">
            <IrisGrade grade={score.grade} size="md" />
            <p className="text-foreground font-mono text-sm font-semibold">
                {score.total.toFixed(1)}
                <span className="text-muted-foreground/70 ml-0.5 text-xs font-normal">/ 100</span>
            </p>
        </div>
    );
}
