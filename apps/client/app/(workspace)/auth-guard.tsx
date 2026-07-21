'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockArtisanById } from '@lumiris/mock-data';
import { useArtisanMe } from '@lumiris/api-client/react';
import { toast } from '@lumiris/ui/components/sonner';
import { useAuthArtisanId, useAuthUserId, useAuthRole, useAuthToken, useAuthHydrated } from '@/lib/use-auth';
import { signOut } from '@/lib/auth-store';
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
    const artisanId = useAuthArtisanId();
    const role = useAuthRole();
    const token = useAuthToken();
    const getRecord = useVerificationStore((s) => s.getRecord);
    const setFromProfile = useVerificationStore((s) => s.setFromProfile);

    // KYB onboarding only applies to artisan accounts — other roles (consumer, repairer, admin)
    // have no ArtisanProfile at all, so GET /api/artisans/me would just 404 for them.
    const isArtisan = role === 'artisan';
    // ATELIER is for artisan and repairer accounts only. `role === null` covers mock/demo-mode
    // sessions that never went through `signInWithToken` — those don't carry a real role and
    // must not be bounced by this real-mode-only check.
    const isAllowedRole = role === null || role === 'artisan' || role === 'repairer';

    // Real mode: GET /api/artisans/me is the source of truth on every load, not local storage.
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
    // ponytail: existing mock artisans are pre-verified so the demo works out of the box
    const isExistingMockArtisan = artisanId ? mockArtisanById(artisanId) !== null : false;

    let status: VerificationStatus;
    if (!isArtisan) {
        status = 'verified'; // non-artisan roles skip onboarding entirely
    } else if (token) {
        if (me.data) status = onboardingSubmitted ? (STATUS_MAP[me.data.status] ?? 'unregistered') : 'unregistered';
        else if (me.isLoading) status = record?.status ?? 'unregistered';
        else status = 'unregistered'; // 404 (no profile yet) or any other fetch error
    } else {
        status =
            record?.status === 'unregistered' && isExistingMockArtisan
                ? 'verified'
                : (record?.status ?? 'unregistered');
    }

    const awaitingLiveCheck = isArtisan && Boolean(token) && me.isLoading && !me.data;

    useEffect(() => {
        if (!hydrated) return;
        if (!userId) {
            router.replace('/login');
            return;
        }
        if (!isAllowedRole) {
            signOut();
            toast.error('Ce compte n’a pas accès à ATELIER', {
                description: 'Utilisez VISION (consommateur) ou la console admin.',
            });
            router.replace('/login');
            return;
        }
        if (awaitingLiveCheck) return;
        if (status === 'unregistered') {
            router.replace('/onboarding');
        }
    }, [hydrated, userId, isAllowedRole, status, router, awaitingLiveCheck]);

    if (!hydrated || !userId) return null;
    if (!isAllowedRole) return null;
    if (awaitingLiveCheck) return null;
    if (status === 'unregistered') return null;
    if (status === 'pending') return <PendingScreen />;
    if (status === 'rejected') return <RejectedScreen />;

    return <>{children}</>;
}
