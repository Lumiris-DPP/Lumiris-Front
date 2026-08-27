'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import type { IrisGrade as IrisGradeLetter } from '@lumiris/types';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import { ChartContainer, type ChartConfig } from '@lumiris/ui/components/chart';
import { GRADE_COLOR } from '@lumiris/scoring-ui';

const GRADES: readonly IrisGradeLetter[] = ['A', 'B', 'C', 'D', 'E'];
const CHART_CONFIG: ChartConfig = { count: { label: 'Passeports' } };

export function GradeDistribution({ distribution }: { distribution: Record<string, number> }) {
    const data = GRADES.map((grade) => ({
        grade,
        count: distribution[grade] ?? 0,
        fill: `var(--${GRADE_COLOR[grade]})`,
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle>Distribution des grades</CardTitle>
                <p className="text-xs text-muted-foreground">A → E sur l’ensemble des passeports actifs</p>
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
