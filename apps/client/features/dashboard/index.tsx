'use client';

import { useDashboardInfo } from '@lumiris/api-client/react';
import { isEsprWindowActive } from '@/lib/regulatory';
import { AttentionBlock } from './attention-block';
import { EmptyState } from './empty-state';
import { GradeDistribution } from './grade-distribution';
import { greeting } from './greeting';
import { KpiTiles } from './kpi-tiles';
import { OrdersCallout } from './orders-callout';
import { RecentPassports } from './recent-passports';

export function Dashboard() {
    const { data, isLoading } = useDashboardInfo();

    if (isLoading) {
        return <p className="p-8 text-sm text-muted-foreground">Chargement du tableau de bord…</p>;
    }
    if (!data) {
        return <p className="p-8 text-sm text-muted-foreground">Tableau de bord indisponible.</p>;
    }

    if (data.published + data.inCompletion + data.drafts === 0) {
        return (
            <div className="space-y-6 p-8">
                <OrdersCallout />
                <EmptyState info={data} />
            </div>
        );
    }

    const quotaPercent = data.quotaLimit ? Math.round((data.quotaUsed / data.quotaLimit) * 100) : 0;
    const esprWindowOpen = isEsprWindowActive(new Date());
    const showAttention = data.expiringCertificates > 0 || data.inCompletion > 0 || quotaPercent > 80 || esprWindowOpen;

    return (
        <div className="space-y-6 p-8">
            <p className="text-lg font-medium text-foreground">{greeting(data.artisanName)}</p>

            <OrdersCallout />

            {showAttention && (
                <AttentionBlock
                    expiringCertificates={data.expiringCertificates}
                    incomplete={data.inCompletion}
                    quotaUsed={data.quotaUsed}
                    quotaLimit={data.quotaLimit}
                    quotaPercent={quotaPercent}
                    esprWindowOpen={esprWindowOpen}
                    publishedCount={data.published}
                />
            )}

            <KpiTiles
                published={data.published}
                incompletion={data.inCompletion}
                drafts={data.drafts}
                avgScore={data.averageIrisScore}
            />

            <GradeDistribution distribution={data.gradeDistribution} />

            <RecentPassports items={data.recentPassports} />
        </div>
    );
}
