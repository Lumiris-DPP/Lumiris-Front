'use client';

import { memo, useMemo } from 'react';
import { mockAdminAuditLog, mockArtisans, mockPassports, mockSubscriptions } from '@lumiris/mock-data';
import { FeatureLayout } from '@lumiris/ui/components/feature-layout';
import { IRIS_AVERAGE_TARGET } from '@/lib/business-targets';
import { buildArtisanKpi, buildCurationKpi, buildIrisKpi, buildMrrKpi, buildTrajectory } from '@/lib/cockpit-metrics';
import { KpiGrid } from './kpi-grid';
import { TrajectoryChart } from './trajectory-chart';

const COCKPIT_NOW = new Date('2026-05-17T08:00:00Z');

function CockpitComponent() {
    const artisanKpi = useMemo(() => buildArtisanKpi(mockArtisans, mockAdminAuditLog, COCKPIT_NOW), []);
    const curationKpi = useMemo(() => buildCurationKpi(mockPassports), []);
    const irisKpi = useMemo(() => buildIrisKpi(mockPassports, mockArtisans, COCKPIT_NOW, IRIS_AVERAGE_TARGET), []);
    const mrrKpi = useMemo(() => buildMrrKpi(mockSubscriptions), []);
    const trajectory = useMemo(() => buildTrajectory(false), []);

    return (
        <FeatureLayout title="Cockpit">
            <div className="space-y-8">
                <KpiGrid artisanKpi={artisanKpi} curationKpi={curationKpi} irisKpi={irisKpi} mrrKpi={mrrKpi} />
                <TrajectoryChart data={trajectory} />
            </div>
        </FeatureLayout>
    );
}

export const Cockpit = memo(CockpitComponent);
