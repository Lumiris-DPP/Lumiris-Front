'use client';

import { memo, Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FeatureLayout } from '@lumiris/ui/components/feature-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lumiris/ui/components/tabs';
import { PermissionGate } from '../_shared/permission-gate';
import { Retoucheurs } from '../retoucheurs';
import { VisionUsers } from '../vision-users';

type TabValue = 'retoucheurs' | 'users';

const VALID_TABS: ReadonlySet<TabValue> = new Set(['retoucheurs', 'users']);

function isTab(value: string | null): value is TabValue {
    return value !== null && VALID_TABS.has(value as TabValue);
}

function ReseauInner() {
    const router = useRouter();
    const params = useSearchParams();
    const initial = params?.get('tab');
    const [tab, setTab] = useState<TabValue>(isTab(initial ?? null) ? (initial as TabValue) : 'retoucheurs');

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
            router.replace(`/reseau?${search.toString()}`, { scroll: false });
        },
        [router, params],
    );

    return (
        <Tabs value={tab} onValueChange={onChange}>
            <FeatureLayout
                title="Réseau"
                tabs={
                    <TabsList>
                        <TabsTrigger value="retoucheurs">Retoucheurs</TabsTrigger>
                        <TabsTrigger value="users">Utilisateurs</TabsTrigger>
                    </TabsList>
                }
            >
                <TabsContent value="retoucheurs" className="mt-0 outline-none">
                    <PermissionGate requires="retoucheur.read">
                        <Retoucheurs />
                    </PermissionGate>
                </TabsContent>
                <TabsContent value="users" className="mt-0 outline-none">
                    <PermissionGate requires="vision_user.read">
                        <VisionUsers />
                    </PermissionGate>
                </TabsContent>
            </FeatureLayout>
        </Tabs>
    );
}

function ReseauComponent() {
    return (
        <Suspense fallback={null}>
            <ReseauInner />
        </Suspense>
    );
}

export const Reseau = memo(ReseauComponent);
