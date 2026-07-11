'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useArtisanMe } from '@lumiris/api-client/react';
import { useAuthUserId, useAuthRole, useAuthToken, useAuthHydrated } from '@/lib/use-auth';
import { useVerificationStore, type VerificationStatus } from '@/lib/verification-store';
import { PendingScreen } from '@/features/verification-status/pending';
import { RejectedScreen } from '@/features/verification-status/rejected';

const STATUS_MAP: Record<string, VerificationStatus> = {
    PENDING: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected',
};

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const hydrated = useAuthHydrated();
    const userId = useAuthUserId();
    const role = useAuthRole();
    const token = useAuthToken();
    const getRecord = useVerificationStore((s) => s.getRecord);
    const setFromProfile = useVerificationStore((s) => s.setFromProfile);

    // KYB onboarding only applies to artisan accounts — other roles (consumer, repairer, admin)
    // have no ArtisanProfile at all, so GET /api/artisans/me would just 404 for them.
    const isArtisan = role === 'artisan';

    // GET /api/artisans/me is the source of truth on every load, not local storage.
    // The backend auto-creates an empty ArtisanProfile row (status defaults to PENDING) for every
    // artisan signup even before onboarding starts, and a user can also stop after step 1 (SIRET)
    // without signing the declaration — so only `declarationSigned` means "actually submitted for
    // review"; `status` alone can't be trusted until then.
    const me = useArtisanMe({ enabled: Boolean(token) && isArtisan });
    const onboardingSubmitted = Boolean(me.data?.declarationSigned);

    useEffect(() => {
        if (me.data && onboardingSubmitted && userId) setFromProfile(userId, me.data);
    }, [me.data, onboardingSubmitted, userId, setFromProfile]);

    const record = userId ? getRecord(userId) : null;

    let status: VerificationStatus;
    if (!isArtisan) {
        status = 'verified'; // non-artisan roles skip onboarding entirely
    } else if (me.data) {
        status = onboardingSubmitted ? (STATUS_MAP[me.data.status] ?? 'unregistered') : 'unregistered';
    } else if (me.isLoading) {
        status = record?.status ?? 'unregistered';
    } else {
        status = 'unregistered'; // 404 (no profile yet) or any other fetch error
    }

    const awaitingLiveCheck = isArtisan && Boolean(token) && me.isLoading && !me.data;

    useEffect(() => {
        if (!hydrated) return;
        if (!userId) {
            router.replace('/login');
            return;
        }
        if (awaitingLiveCheck) return;
        if (status === 'unregistered') {
            router.replace('/onboarding');
        }
    }, [hydrated, userId, status, router, awaitingLiveCheck]);

    if (!hydrated || !userId) return null;
    if (awaitingLiveCheck) return null;
    if (status === 'unregistered') return null;
    if (status === 'pending') return <PendingScreen />;
    if (status === 'rejected') return <RejectedScreen />;

    return <>{children}</>;
}
