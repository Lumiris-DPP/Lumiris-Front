'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import type { IrisGrade as IrisGradeLetter } from '@lumiris/types';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import { ChartContainer, type ChartConfig } from '@lumiris/ui/components/chart';
import { GRADE_COLOR } from '@lumiris/scoring-ui';
import type { ScoredPassport } from './derive';

const GRADES: readonly IrisGradeLetter[] = ['A', 'B', 'C', 'D', 'E'];
const CHART_CONFIG: ChartConfig = { count: { label: 'Passeports' } };

export function GradeDistribution({ scored }: { scored: readonly ScoredPassport[] }) {
    const data = buildDistribution(scored);
    return (
        <Card>
            <CardHeader>
                <CardTitle>Distribution des grades</CardTitle>
                <p className="text-muted-foreground text-xs">A → E sur l’ensemble des passeports actifs</p>
            </CardHeader>
            <CardContent>
                <ChartContainer config={CHART_CONFIG} className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis dataKey="grade" tickLine={false} axisLine={false} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

function buildDistribution(scored: readonly ScoredPassport[]) {
    const buckets: Record<IrisGradeLetter, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    for (const { score, passport } of scored) {
        if (passport.status === 'Draft') continue;
        buckets[score.grade] += 1;
    }
    return GRADES.map((grade) => ({
        grade,
        count: buckets[grade],
        fill: `var(--${GRADE_COLOR[grade]})`,
    }));
}
