'use client';

import type { HTMLAttributes } from 'react';
import type { Material } from '@lumiris/types';
import { CompositionList, type CompositionListProps } from './composition-list';

export interface MaterialBreakdownProps extends Omit<CompositionListProps, 'composition'> {
    materials: readonly Material[];
}

export function MaterialBreakdown({ materials, ...rest }: MaterialBreakdownProps & HTMLAttributes<HTMLDivElement>) {
    return <CompositionList composition={materials} {...rest} />;
}
