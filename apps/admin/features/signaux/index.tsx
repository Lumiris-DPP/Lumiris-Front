'use client';

import { memo, Suspense, useMemo, useState } from 'react';
import { mockAffiliationEvents } from '@lumiris/mock-data';
import { FeatureLayout } from '@lumiris/ui/components/feature-layout';
import { ANONYMISATION_THRESHOLD_DAYS, buildSuspicionMap } from '@/lib/affiliation-fraud';
import { DetectionsTab } from '@/features/affiliation/detections-tab';
import { SystemAnomaliesTab } from './system-anomalies-tab';

function SignauxInner() {
    const [extraFlagged, setExtraFlagged] = useState<ReadonlySet<string>>(new Set());
    const [resolvedCases, setResolvedCases] = useState<ReadonlySet<string>>(new Set());
    const [anonymisedCases, setAnonymisedCases] = useState<ReadonlySet<string>>(new Set());
    const [resolvedAnomalies, setResolvedAnomalies] = useState<ReadonlySet<string>>(new Set());
    const [thresholdDays, setThresholdDays] = useState(ANONYMISATION_THRESHOLD_DAYS);

    const events = useMemo(
        () =>
            mockAffiliationEvents.map((e) => ({
                ...e,
                flaggedAsFraud: e.flaggedAsFraud || extraFlagged.has(e.id),
            })),
        [extraFlagged],
    );

    const suspicions = useMemo(() => buildSuspicionMap(events), [events]);

    const addTo = <T,>(set: ReadonlySet<T>, value: T): ReadonlySet<T> => {
        const next = new Set(set);
        next.add(value);
        return next;
    };

    return (
        <FeatureLayout title="Signaux" description="Anomalies système, fraudes et anti-conflit d'intérêt — unifiés.">
            <div className="space-y-10">
                <section className="space-y-3">
                    <header>
                        <h2 className="text-foreground text-base font-semibold">Anomalies système</h2>
                        <p className="text-muted-foreground text-xs">
                            Détections automatiques sur le journal d&apos;audit admin.
                        </p>
                    </header>
                    <SystemAnomaliesTab />
                </section>

                <section className="space-y-3">
                    <header>
                        <h2 className="text-foreground text-base font-semibold">Détections affiliation</h2>
                        <p className="text-muted-foreground text-xs">
                            Cas de fraude et anti-conflit sur les commissions partenaires.
                        </p>
                    </header>
                    <DetectionsTab
                        events={events}
                        suspicions={suspicions}
                        resolvedCases={resolvedCases}
                        anonymisedCases={anonymisedCases}
                        resolvedAnomalies={resolvedAnomalies}
                        thresholdDays={thresholdDays}
                        onFlagFraud={(id) => setExtraFlagged((prev) => addTo(prev, id))}
                        onResolveCase={(id) => setResolvedCases((prev) => addTo(prev, id))}
                        onAnonymiseCase={(id) => setAnonymisedCases((prev) => addTo(prev, id))}
                        onResolveAnomaly={(id) => setResolvedAnomalies((prev) => addTo(prev, id))}
                        onSaveThreshold={setThresholdDays}
                    />
                </section>
            </div>
        </FeatureLayout>
    );
}

function SignauxComponent() {
    return (
        <Suspense fallback={null}>
            <SignauxInner />
        </Suspense>
    );
}

export const Signaux = memo(SignauxComponent);
