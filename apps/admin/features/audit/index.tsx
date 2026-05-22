'use client';

import { Suspense } from 'react';
import { FeatureLayout } from '@lumiris/ui/components/feature-layout';
import { AuditList } from './list';

export function AuditFeature() {
    return (
        <Suspense fallback={null}>
            <FeatureLayout title="Audit" description="Trace immuable des actions admin.">
                <AuditList />
            </FeatureLayout>
        </Suspense>
    );
}
