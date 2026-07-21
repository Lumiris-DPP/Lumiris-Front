'use client';

import { useMemo } from 'react';
import {
    OriginMap as SharedOriginMap,
    type OriginMapOriginPoint,
    type OriginMapStepPoint,
} from '@lumiris/scoring-ui/components/origin-map';
import { CITY_COORDS, COUNTRY_COORDS } from '@lumiris/mock-data';
import type { Material, ProductionStep } from '@lumiris/types';

interface OriginMapProps {
    materials: readonly Material[];
    steps: readonly ProductionStep[];
}

export function OriginMap({ materials, steps }: OriginMapProps) {
    const origins: OriginMapOriginPoint[] = useMemo(
        () =>
            materials.map((m, i) => {
                const country = COUNTRY_COORDS[m.originCountry];
                return {
                    id: `${m.fiber}-${i}`,
                    label: m.fiber,
                    country: country?.name ?? m.originCountry,
                    latitude: country?.lat,
                    longitude: country?.lng,
                };
            }),
        [materials],
    );

    const stepPoints: OriginMapStepPoint[] = useMemo(
        () =>
            steps.map((step, idx) => {
                const coords = CITY_COORDS[step.locationCity];
                return {
                    id: step.id,
                    order: idx + 1,
                    label: step.label,
                    sublabel: step.performedBy,
                    city: step.locationCity,
                    country: step.locationCountry,
                    latitude: coords?.lat,
                    longitude: coords?.lng,
                };
            }),
        [steps],
    );

    return <SharedOriginMap origins={origins} steps={stepPoints} />;
}
