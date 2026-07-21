'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockArtisanById } from '@lumiris/mock-data';
import { useArtisanMe, useRepairerMe } from '@lumiris/api-client/react';
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

    const isArtisan = role === 'artisan';
    const isRepairer = role === 'repairer';
    // ATELIER is for artisan and repairer accounts only. `role === null` covers mock/demo-mode
    // sessions that never went through `signInWithToken` — those don't carry a real role and
    // must not be bounced by this real-mode-only check.
    const isAllowedRole = role === null || isArtisan || isRepairer;

    // Real mode: GET /api/artisans/me (resp. /api/repairers/me) is the source of truth on every
    // load, not local storage. The backend creates the profile row (status PENDING) as soon as
    // the SIRET step completes — so "submitted for review" also requires the KYB dossier
    // (declaration + KYB for artisan, KYB alone for repairer), not just a PENDING status.
    const me = useArtisanMe({ enabled: Boolean(token) && isArtisan });
    const artisanSubmitted = Boolean(me.data?.declarationSigned && me.data?.kyb?.termsAcceptedAt);

    const repairerMe = useRepairerMe({ enabled: Boolean(token) && isRepairer });
    const repairerSubmitted = Boolean(repairerMe.data?.kyb?.termsAcceptedAt);

    useEffect(() => {
        if (isArtisan && me.data && artisanSubmitted && userId) setFromProfile(userId, me.data);
    }, [isArtisan, me.data, artisanSubmitted, userId, setFromProfile]);

    const record = userId ? getRecord(userId) : null;
    // ponytail: existing mock artisans are pre-verified so the demo works out of the box
    const isExistingMockArtisan = artisanId ? mockArtisanById(artisanId) !== null : false;

    let status: VerificationStatus;
    if (isRepairer) {
        if (token) {
            if (repairerMe.data) {
                status = repairerSubmitted ? (STATUS_MAP[repairerMe.data.status] ?? 'unregistered') : 'unregistered';
            } else if (repairerMe.isLoading) {
                status = record?.status ?? 'unregistered';
            } else {
                status = 'unregistered'; // 404 (no profile yet) or any other fetch error
            }
        } else {
            status = record?.status ?? 'unregistered';
        }
    } else if (!isArtisan) {
        status = 'verified'; // consumer/admin never reach here (blocked earlier); mock-mode fallback
    } else if (token) {
        if (me.data) status = artisanSubmitted ? (STATUS_MAP[me.data.status] ?? 'unregistered') : 'unregistered';
        else if (me.isLoading) status = record?.status ?? 'unregistered';
        else status = 'unregistered'; // 404 (no profile yet) or any other fetch error
    } else {
        status =
            record?.status === 'unregistered' && isExistingMockArtisan
                ? 'verified'
                : (record?.status ?? 'unregistered');
    }

    const awaitingLiveCheck =
        (isArtisan && Boolean(token) && me.isLoading && !me.data) ||
        (isRepairer && Boolean(token) && repairerMe.isLoading && !repairerMe.data);

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
