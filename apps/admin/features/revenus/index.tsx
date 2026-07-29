'use client';

import { memo, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { mockAffiliationEvents, mockPayouts } from '@lumiris/mock-data';
import { FeatureLayout } from '@lumiris/ui/components/feature-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lumiris/ui/components/tabs';
import { buildSuspicionMap } from '@/lib/affiliation-fraud';
import { OverviewTab as SubscriptionsTab } from '@/features/billing/overview-tab';
import { PaymentsTab } from '@/features/billing/payments-tab';
import { PayoutsTab } from '@/features/affiliation/payouts-tab';
import { RatesTab } from '@/features/affiliation/rates-tab';
import { inferBankStatus, type BankStatus } from '@/features/affiliation/types';
import { PermissionGate } from '../_shared/permission-gate';

type TabValue = 'subscriptions' | 'payments' | 'affiliation';

const VALID_TABS: ReadonlySet<TabValue> = new Set(['subscriptions', 'payments', 'affiliation']);

function isTab(value: string | null): value is TabValue {
    return value !== null && VALID_TABS.has(value as TabValue);
}

function RevenusInner() {
    const router = useRouter();
    const params = useSearchParams();
    const initial = params?.get('tab');
    const [tab, setTab] = useState<TabValue>(isTab(initial ?? null) ? (initial as TabValue) : 'subscriptions');

    useEffect(() => {
        const next = params?.get('tab');
        if (isTab(next ?? null) && next !== tab) setTab(next as TabValue);
    }, [params, tab]);

    const onChange = useCallback(
        (value: string) => {
            if (!isTab(value)) return;
            setTab(value);
            const search = new URLSearchParams(params?.toString() ?? '');
            search.set('tab', value);
            router.replace(`/revenus?${search.toString()}`, { scroll: false });
        },
        [router, params],
    );

    const [paidEventIds, setPaidEventIds] = useState<ReadonlySet<string>>(new Set());
    const [bankStatuses, setBankStatuses] = useState<ReadonlyMap<string, BankStatus>>(
        () => new Map(mockPayouts.map((p) => [p.id, inferBankStatus(p)])),
    );
    const [comments, setComments] = useState<ReadonlyMap<string, string>>(() => new Map());

    const events = useMemo(
        () =>
            mockAffiliationEvents.map((e) => ({
                ...e,
                payoutStatus: paidEventIds.has(e.id) ? ('paid' as const) : e.payoutStatus,
            })),
        [paidEventIds],
    );

    const suspicions = useMemo(() => buildSuspicionMap(events), [events]);

    return (
        <Tabs value={tab} onValueChange={onChange}>
            <FeatureLayout
                title="Revenus"
                tabs={
                    <TabsList>
                        <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
                        <TabsTrigger value="payments">Paiements</TabsTrigger>
                        <TabsTrigger value="affiliation">Affiliation</TabsTrigger>
                    </TabsList>
                }
            >
                <TabsContent value="subscriptions" className="mt-0 outline-none">
                    <PermissionGate requires="billing.read">
                        <SubscriptionsTab />
                    </PermissionGate>
                </TabsContent>
                <TabsContent value="payments" className="mt-0 outline-none">
                    <PermissionGate requires="billing.read">
                        <PaymentsTab />
                    </PermissionGate>
                </TabsContent>
                <TabsContent value="affiliation" className="mt-0 space-y-10 outline-none">
                    <PermissionGate requires="affiliation.read">
                        <PayoutsTab
                            payouts={mockPayouts}
                            events={events}
                            suspicions={suspicions}
                            bankStatuses={bankStatuses}
                            comments={comments}
                            onUpdateBankStatus={(id, status) =>
                                setBankStatuses((prev) => {
                                    const next = new Map(prev);
                                    next.set(id, status);
                                    return next;
                                })
                            }
                            onUpdateComment={(id, value) =>
                                setComments((prev) => {
                                    const next = new Map(prev);
                                    next.set(id, value);
                                    return next;
                                })
                            }
                            onPreparePayout={(eventIds) =>
                                setPaidEventIds((prev) => {
                                    const next = new Set(prev);
                                    for (const id of eventIds) next.add(id);
                                    return next;
                                })
                            }
                        />
                        <section className="space-y-3">
                            <header>
                                <h2 className="text-base font-semibold text-foreground">Tarifs</h2>
                            </header>
                            <RatesTab />
                        </section>
                    </PermissionGate>
                </TabsContent>
            </FeatureLayout>
        </Tabs>
    );
}

function RevenusComponent() {
    return (
        <Suspense fallback={null}>
            <RevenusInner />
        </Suspense>
    );
}

export const Revenus = memo(RevenusComponent);
