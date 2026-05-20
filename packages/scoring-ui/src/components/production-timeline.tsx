'use client';

import type { HTMLAttributes } from 'react';
import type { ProductionStep } from '@lumiris/types';
import { ManufacturingTimeline, type ManufacturingTimelineProps } from './manufacturing-timeline';

export interface ProductionTimelineProps extends Omit<ManufacturingTimelineProps, 'steps'> {
    steps: readonly ProductionStep[];
}

export function ProductionTimeline({ steps, ...rest }: ProductionTimelineProps & HTMLAttributes<HTMLDivElement>) {
    return <ManufacturingTimeline steps={steps} {...rest} />;
}
