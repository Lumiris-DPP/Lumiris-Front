'use client';

import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@lumiris/ui/components/chart';
import type { buildTrajectory } from '@/lib/cockpit-metrics';

interface TrajectoryChartProps {
    data: ReturnType<typeof buildTrajectory>;
}

const TRAJECTORY_CONFIG = {
    arrAtelier: { label: 'ATELIER (B2B)', color: 'var(--lumiris-emerald)' },
    arrAffiliation: { label: 'Affiliation B2C', color: 'var(--lumiris-cyan)' },
    arrLocal: { label: 'LUMIRIS Local', color: 'var(--lumiris-iris)' },
    chargesAnnualized: { label: 'Charges annualisées', color: 'var(--lumiris-rose)' },
} satisfies ChartConfig;

const eurCompact = (value: number): string => {
    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} M€`;
    if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)} k€`;
    return `${Math.round(value)} €`;
};

export function TrajectoryChart({ data }: TrajectoryChartProps) {
    const [breakevenStart, breakevenEnd] = data.breakevenRange;
    return (
        <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-6 py-4">
                <h3 className="text-sm font-semibold text-foreground">Trajectoire</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    Point mort M{breakevenStart}–M{breakevenEnd}
                </p>
            </div>
            <div className="px-3 pt-4 pb-3">
                <ChartContainer config={TRAJECTORY_CONFIG} className="h-72 w-full">
                    <ComposedChart data={[...data.points]} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={10} interval={2} />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            fontSize={10}
                            tickFormatter={(v: number) => eurCompact(v)}
                            width={56}
                        />
                        <ReferenceArea
                            x1={`M${breakevenStart}`}
                            x2={`M${breakevenEnd}`}
                            strokeOpacity={0}
                            fill="var(--lumiris-amber)"
                            fillOpacity={0.12}
                            label={{
                                value: 'Point mort',
                                position: 'insideTop',
                                fill: 'var(--lumiris-amber)',
                                fontSize: 10,
                            }}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent indicator="dot" formatter={(value) => eurCompact(Number(value))} />
                            }
                        />
                        <Area
                            type="monotone"
                            dataKey="arrAtelier"
                            stackId="arr"
                            stroke="var(--color-arrAtelier)"
                            fill="var(--color-arrAtelier)"
                            fillOpacity={0.5}
                        />
                        <Area
                            type="monotone"
                            dataKey="arrAffiliation"
                            stackId="arr"
                            stroke="var(--color-arrAffiliation)"
                            fill="var(--color-arrAffiliation)"
                            fillOpacity={0.5}
                        />
                        <Area
                            type="monotone"
                            dataKey="arrLocal"
                            stackId="arr"
                            stroke="var(--color-arrLocal)"
                            fill="var(--color-arrLocal)"
                            fillOpacity={0.5}
                        />
                        <Line
                            type="monotone"
                            dataKey="chargesAnnualized"
                            stroke="var(--color-chargesAnnualized)"
                            strokeDasharray="4 4"
                            strokeWidth={2}
                            dot={false}
                        />
                    </ComposedChart>
                </ChartContainer>
            </div>
        </div>
    );
}
