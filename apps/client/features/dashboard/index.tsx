'use client';

import { useMemo } from 'react';
import { computeScore } from '@lumiris/core/scoring';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { usePassports } from '@/lib/passports-source';
import { isEsprWindowActive } from '@/lib/regulatory';
import { AttentionBlock } from './attention-block';
import {
    expiringCertificates,
    incompletePassports,
    loadMergedCertificates,
    loadMergedInvoices,
    onboardingChecklist,
    quotaUsage,
    type ScoredPassport,
} from './derive';
import { EmptyState } from './empty-state';
import { GradeDistribution } from './grade-distribution';
import { greeting } from './greeting';
import { KpiTiles } from './kpi-tiles';
import { RecentPassports } from './recent-passports';

export function Dashboard() {
    const artisan = useCurrentArtisan();
    // Detailed = fetch each DPP's full data in real mode so Iris scores/grades reflect real
    // materials & eco fields (never a fabricated E from an empty summary).
    const passports = usePassports(artisan.id, { detailed: true });

    const now = useMemo(() => new Date(), []);
    const certificates = useMemo(() => loadMergedCertificates(artisan.id), [artisan.id]);
    const invoices = useMemo(() => loadMergedInvoices(artisan.id), [artisan.id]);

    const scored: readonly ScoredPassport[] = useMemo(
        () =>
            passports.map((passport) => ({
                passport,
                score: computeScore(passport, { artisan, certificates, now }),
            })),
        [artisan, passports, certificates, now],
    );

    const isEmpty = passports.length === 0;
    const checklist = useMemo(() => onboardingChecklist(artisan, passports, invoices), [artisan, passports, invoices]);

    if (isEmpty) {
        return (
            <div className="space-y-6 p-8">
                <EmptyState artisan={artisan} items={checklist} />
            </div>
        );
    }

    const expiring = expiringCertificates(certificates, now);
    const incomplete = incompletePassports(scored);
    const quota = quotaUsage(passports, artisan.tier);
    const showEspr = isEsprWindowActive(now);

    const published = scored.filter((s) => s.passport.status === 'Published');
    const stats = {
        published: published.length,
        incompletion: scored.filter((s) => s.passport.status === 'InCompletion').length,
        drafts: scored.filter((s) => s.passport.status === 'Draft').length,
        avgScore:
            published.length === 0
                ? 0
                : Math.round((published.reduce((acc, s) => acc + s.score.total, 0) / published.length) * 10) / 10,
    };

    const showAttention = expiring.length > 0 || incomplete.length > 0 || quota.percent > 80 || showEspr;
    const recent = [...scored].sort((a, b) => (a.passport.updatedAt < b.passport.updatedAt ? 1 : -1)).slice(0, 5);

    return (
        <div className="space-y-6 p-8">
            <p className="text-foreground text-lg font-medium">{greeting(artisan)}</p>

            {showAttention && (
                <AttentionBlock
                    expiring={expiring}
                    incomplete={incomplete}
                    quota={quota}
                    esprWindowOpen={showEspr}
                    publishedCount={stats.published}
                />
            )}

            <KpiTiles
                published={stats.published}
                incompletion={stats.incompletion}
                drafts={stats.drafts}
                avgScore={stats.avgScore}
            />

            <GradeDistribution scored={scored} />

            <RecentPassports items={recent} />
        </div>
    );
}
